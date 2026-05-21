import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Booking } from '../models/Booking';
import { Event } from '../models/Event';
import { confirmBookingAndIssueTickets } from '../services/bookingPayment.service';
import { payOS } from '../config/payos.client';

const PAYMENT_TTL_MS = 5 * 60 * 1000;

const normalizeEventTitle = (title: string): string => {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
};

const releaseSeatsForBooking = async (bookingId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return;
    }

    const event = await Event.findById(booking.eventId).session(session);
    if (event) {
      event.seatMap.reservedSeats = event.seatMap.reservedSeats.filter(
        (seat: string) => !booking.selectedSeats.includes(seat)
      );
      event.availableSeats = Math.min(event.totalSeats, event.availableSeats + booking.selectedSeats.length);
      await event.save({ session });
    }

    booking.paymentStatus = 'failed';
    booking.paymentMethod = 'payos';
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/payment/payos/create
 * Creates a PayOS payment link for a booking.
 */
export const createPayOSOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
    }

    const booking = await Booking.findById(bookingId).populate('eventId', 'title');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (booking.userId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập đơn hàng này' });
    }

    if (booking.paymentStatus === 'successful') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán' });
    }

    let payosOrderCode = 0;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = Math.floor(10000000 + Math.random() * 90000000);
      const existing = await Booking.findOne({ payosOrderCode: candidate });
      if (!existing) {
        payosOrderCode = candidate;
        break;
      }
    }

    if (!payosOrderCode) {
      return res.status(500).json({ success: false, message: 'Không thể tạo mã giao dịch PayOS độc nhất' });
    }

    const amount = Math.round(booking.totalPrice);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const eventTitle = booking.eventId && (booking.eventId as any).title ? normalizeEventTitle((booking.eventId as any).title) : 'Ticket';
    const description = `TT ${booking.bookingCode} ${eventTitle}`.substring(0, 25).trim();

    const paymentData = {
      orderCode: payosOrderCode,
      amount,
      description,
      cancelUrl: `${frontendUrl}/payment/result?source=payos&bookingId=${booking._id}&status=cancelled`,
      returnUrl: `${frontendUrl}/payment/result?source=payos&bookingId=${booking._id}`,
      buyerName: booking.passengerInfo.name || 'Khach hang',
      buyerEmail: booking.passengerInfo.email || 'customer@jcticket.com',
      buyerPhone: booking.passengerInfo.phone || '0900000000',
    };

    const paymentLink = await payOS.paymentRequests.create(paymentData);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const freshBooking = await Booking.findById(booking._id).session(session);
      if (!freshBooking) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      const event = await Event.findById(freshBooking.eventId).session(session);
      if (!event) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
      }

      const conflict = freshBooking.selectedSeats.filter((seat: string) => event.seatMap.reservedSeats.includes(seat));
      if (conflict.length > 0) {
        await session.abortTransaction();
        return res.status(409).json({ success: false, message: `Ghế đã được giữ trước đó: ${conflict.join(', ')}` });
      }

      event.seatMap.reservedSeats.push(...freshBooking.selectedSeats);
      event.availableSeats = Math.max(0, event.availableSeats - freshBooking.selectedSeats.length);
      await event.save({ session });

      freshBooking.paymentMethod = 'payos';
      freshBooking.payosOrderCode = payosOrderCode;
      freshBooking.paymentId = paymentLink.paymentLinkId;
      freshBooking.paymentStatus = 'pending';
      freshBooking.expiresAt = new Date(Date.now() + PAYMENT_TTL_MS);
      await freshBooking.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error reserving seats for PayOS:', error);
      return res.status(500).json({ success: false, message: 'Không thể reserve ghế cho quá trình thanh toán' });
    } finally {
      session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: 'Tạo link thanh toán PayOS thành công',
      data: {
        checkoutUrl: paymentLink.checkoutUrl,
        paymentLinkId: paymentLink.paymentLinkId,
        orderCode: payosOrderCode,
      },
    });
  } catch (error: any) {
    console.error('❌ PayOS Create Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo liên kết thanh toán PayOS',
      error: error.message,
    });
  }
};

/**
 * POST /api/payment/payos/webhook
 * Handles Webhook/IPN callbacks from PayOS server.
 */
export const payosWebhook = async (req: any, res: Response) => {
  try {
    const { data, signature } = req.body;
    if (!data || !signature) {
      return res.status(400).json({ success: false, message: 'Missing data or signature' });
    }

    let verifiedData;
    try {
      verifiedData = await payOS.webhooks.verify(req.body);
    } catch (sigError: any) {
      console.error('❌ [PayOS Webhook] Signature verification failed:', sigError.message);
      return res.status(400).json({ success: false, message: 'Chữ ký không hợp lệ' });
    }

    const { orderCode, amount, code } = verifiedData;

    if (verifiedData.description === 'Ma xac thuc webhook' || orderCode === 123) {
      return res.status(200).json({ success: true, message: 'Webhook verified' });
    }

    const booking = await Booking.findOne({ payosOrderCode: orderCode });
    if (!booking) {
      return res.status(200).json({ success: true, message: 'Đơn hàng không tồn tại' });
    }

    if (Number(amount) !== Math.round(booking.totalPrice)) {
      return res.status(200).json({ success: true, message: 'Số tiền thanh toán không hợp lệ' });
    }

    if (booking.paymentStatus === 'successful' || booking.status === 'confirmed') {
      return res.status(200).json({ success: true, message: 'Đơn hàng đã được xác nhận trước đó' });
    }

    if (code === '00') {
      try {
        await confirmBookingAndIssueTickets({
          bookingId: booking._id.toString(),
          paymentMethod: 'payos',
          paymentId: verifiedData.reference,
          skipIfAlreadySuccessful: true,
        });
      } catch (ticketErr: any) {
        console.error('❌ Ticket generation error (PayOS Webhook):', ticketErr.message);
      }
    } else {
      await releaseSeatsForBooking(booking._id.toString());
    }

    return res.status(200).json({ success: true, message: 'Đã xử lý webhook thành công' });
  } catch (error: any) {
    console.error('🔥 [PayOS Webhook] Error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/payment/payos/status/:bookingId
 * Checks booking payment status and syncs with PayOS if necessary.
 */
export const checkPayOSStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId || typeof bookingId !== 'string' || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (booking.userId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập đơn hàng này' });
    }

    if (booking.paymentStatus === 'successful' && booking.status === 'confirmed') {
      return res.status(200).json({
        success: true,
        message: 'Thanh toán thành công (Xác nhận local)',
        data: { status: 'success' },
      });
    }

    if (!booking.payosOrderCode) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng không có thông tin thanh toán PayOS',
      });
    }

    const paymentInfo = await payOS.paymentRequests.get(booking.payosOrderCode);

    if (paymentInfo.status === 'PAID') {
      try {
        const paymentId = paymentInfo.transactions?.[0]?.reference || booking.paymentId;
        await confirmBookingAndIssueTickets({
          bookingId: booking._id.toString(),
          paymentMethod: 'payos',
          ...(paymentId ? { paymentId } : {}),
          skipIfAlreadySuccessful: true,
        });
      } catch (ticketErr: any) {
        console.error('❌ Ticket generation error (PayOS Status Check):', ticketErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Thanh toán thành công',
        data: { status: 'success' },
      });
    }

    if (paymentInfo.status === 'CANCELLED') {
      booking.paymentStatus = 'failed';
      booking.status = 'cancelled';
      await booking.save();
      return res.status(200).json({
        success: false,
        message: 'Giao dịch đã bị hủy',
        data: { status: 'failed' },
      });
    }

    return res.status(200).json({
      success: false,
      message: 'Giao dịch chưa được hoàn tất',
      data: { status: 'pending' },
    });
  } catch (error: any) {
    console.error('❌ PayOS status check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái thanh toán PayOS',
      error: error.message,
    });
  }
};
