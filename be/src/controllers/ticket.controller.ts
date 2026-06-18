import { Response } from 'express';
import { Ticket } from '../models/Ticket';
import { AuthRequest } from '../middleware/auth';

/**
 * Ticket Controller - Quản lý vé điện tử
 */

/**
 * GET /api/tickets/my
 * Lấy danh sách vé của user hiện tại
 */
export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = { userId: req.user?.id };
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .populate('eventId', 'title image date location venue')
      .populate('bookingId', 'bookingCode totalPrice')
      .sort({ issuedAt: -1 });

    return res.status(200).json({ success: true, data: tickets });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/tickets/:ticketCode
 * Lấy chi tiết 1 vé
 */
export const getTicketByCode = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.ticketCode } as any)
      .populate('eventId', 'title image date endDate location venue organizer')
      .populate('bookingId', 'bookingCode totalPrice passengerInfo selectedSeats')
      .populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Chỉ owner hoặc admin mới xem được
    const ticketOwnerId = (ticket.userId as any)._id
      ? (ticket.userId as any)._id.toString()
      : ticket.userId.toString();

    if (ticketOwnerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/tickets/verify/:ticketCode
 * Public endpoint - Xác thực vé (dùng khi scan QR)
 */
export const verifyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.ticketCode } as any)
      .populate('eventId', 'title date location venue')
      .populate('bookingId', 'bookingCode');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Vé không tồn tại',
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Vé đã được sử dụng',
        data: { usedAt: ticket.usedAt },
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Vé đã bị hủy',
      });
    }

    if (ticket.status === 'expired') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Vé đã hết hạn',
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Vé hợp lệ ✅',
      data: {
        ticketCode: ticket.ticketCode,
        event: ticket.eventId,
        seatNumber: ticket.seatNumber,
        ticketType: ticket.ticketType,
        passengerName: ticket.passengerName,
        status: ticket.status,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/tickets/:ticketCode/use
 * Đánh dấu vé đã sử dụng (admin/staff scan QR)
 */
export const markTicketUsed = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.ticketCode } as any);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Event admin: verify ticket belongs to their event
    if (req.user?.role === 'event_admin') {
      const managedIds = req.user.managedEventIds || [];
      if (!managedIds.includes(ticket.eventId.toString())) {
        return res.status(403).json({ success: false, message: 'You can only manage tickets for your assigned events.' });
      }
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot use ticket. Current status: ${ticket.status}`,
      });
    }

    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Ticket marked as used',
      data: ticket,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/tickets (admin only)
 * Lấy tất cả tickets
 */
export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, eventId, page = '1', limit = '20', search } = req.query as Record<string, string>;

    const filter: any = {};
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;

    // Event admin: scope to their managed events
    if (req.user?.role === 'event_admin') {
      const managedIds = req.user.managedEventIds || [];
      filter.eventId = eventId ? eventId : { $in: managedIds };
    }

    if (search) {
      filter.$or = [
        { ticketCode: { $regex: search, $options: 'i' } },
        { passengerName: { $regex: search, $options: 'i' } },
        { passengerPhone: { $regex: search, $options: 'i' } },
        { passengerEmail: { $regex: search, $options: 'i' } },
        { seatNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = status === 'used' ? { updatedAt: -1 } : { issuedAt: -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('eventId', 'title date')
        .populate('bookingId', 'bookingCode')
        .sort(sortOption as any)
        .skip(skip)
        .limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
