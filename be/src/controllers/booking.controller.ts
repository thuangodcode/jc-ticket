import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import { confirmBookingAndIssueTickets } from '../services/bookingPayment.service';

/**
 * Booking Controller - Quản lý đơn đặt vé
 */

/**
 * POST /api/bookings
 * Tạo đơn đặt vé mới (yêu cầu auth)
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, tickets, selectedSeats, passengerInfo } = req.body;

    // Validate input
    if (!eventId || !tickets || !selectedSeats || !passengerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventId, tickets, selectedSeats, passengerInfo',
      });
    }

    if (!passengerInfo.name || !passengerInfo.email || !passengerInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Passenger info requires name, email, and phone',
      });
    }

    if (!selectedSeats.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one seat must be selected',
      });
    }

    // Tìm event và lock (atomic update)
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Event is not active' });
    }

    // Kiểm tra ghế đã bị đặt chưa
    const alreadyReserved = selectedSeats.filter((s: string) =>
      event.seatMap.reservedSeats.includes(s)
    );
    if (alreadyReserved.length > 0) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: `Seats already taken: ${alreadyReserved.join(', ')}`,
        data: { conflictSeats: alreadyReserved },
      });
    }

    // Kiểm tra đủ ghế
    if (event.availableSeats < selectedSeats.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Not enough seats. Available: ${event.availableSeats}`,
      });
    }

    // Tính tổng giá
    let totalPrice = 0;
    const ticketItems: { ticketType: string; quantity: number; unitPrice: number }[] = [];
    for (const seat of selectedSeats) {
      const rowLetter = seat.charAt(0);
      const rowIndex = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0);
      const isVip = event.seatMap.vipRows.includes(rowIndex);
      const price = isVip ? (event.vipPrice || event.price * 1.5) : event.price;
      totalPrice += price;

      // Gom nhóm ticket theo type
      const type = isVip ? 'vip' : 'standard';
      const existing = ticketItems.find(t => t.ticketType === type);
      if (existing) {
        existing.quantity += 1;
      } else {
        ticketItems.push({ ticketType: type, quantity: 1, unitPrice: price });
      }
    }

    // NOTE: Seats are NOT reserved here. Reservation happens when
    // the user starts the payment process (to keep seats visible
    // until payment is actually initiated). We still validate
    // availability above so the frontend can show conflicts early.

    // Tạo booking
    const booking = new Booking({
      userId: req.user?.id,
      eventId,
      tickets: ticketItems,
      selectedSeats,
      totalPrice,
      passengerInfo,
      paymentStatus: 'pending',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 phút
    });

    await booking.save({ session });
    await session.commitTransaction();

    // Populate event info cho response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('eventId', 'title image date location venue price vipPrice');

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/bookings/my
 * Lấy danh sách booking của user hiện tại
 */
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.user?.id } as any)
      .populate('eventId', 'title image date location venue price')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/bookings/:id
 * Lấy chi tiết booking (owner hoặc admin)
 */
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title image date endDate location venue price vipPrice organizer');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership or admin (userId is NOT populated here, so .toString() works)
    const bookingUserId = booking.userId.toString();
    if (bookingUserId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/bookings (admin only)
 * Lấy tất cả bookings với filter
 */
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: any = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('eventId', 'title image date')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/bookings/:id/confirm (admin only)
 * Admin xác nhận thanh toán thủ công
 */
export const adminConfirmBookingPayment = async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const { booking, tickets, alreadyConfirmed } = await confirmBookingAndIssueTickets({
      bookingId,
      paymentMethod: 'payos',
      skipIfAlreadySuccessful: true,
    });

    if (alreadyConfirmed) {
      return res.status(400).json({ success: false, message: 'Booking already confirmed' });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed and tickets generated',
      data: { booking, ticketsGenerated: tickets.length },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/bookings/:id/cancel
 * Hủy booking
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership or admin
    if (booking.userId.toString() !== req.user?.id && req.user?.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    // Prevent regular users from cancelling already-paid bookings
    if (booking.paymentStatus === 'successful' && req.user?.role !== 'admin') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot cancel a booking that has been paid. Contact support.' });
    }

    // Trả lại ghế cho event
    const event = await Event.findById(booking.eventId).session(session);
    if (event) {
      event.seatMap.reservedSeats = event.seatMap.reservedSeats.filter(
        (s: string) => !booking.selectedSeats.includes(s)
      );
      event.availableSeats += booking.selectedSeats.length;
      await event.save({ session });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    if (booking.paymentStatus === 'successful') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/bookings/stats (admin only)
 * Thống kê tổng quan cho admin dashboard
 */
export const getBookingStats = async (_req: AuthRequest, res: Response) => {
  try {
    void _req;
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      revenueResult,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ paymentStatus: 'pending' }),
      Booking.countDocuments({ paymentStatus: 'successful' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'successful' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: revenueResult[0]?.total || 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
