import { Response } from 'express';
import { Ticket } from '../models/Ticket';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

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

    // Deny access to System Admin
    if (req.user?.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const ticketOwnerId = (ticket.userId as any)._id
      ? (ticket.userId as any)._id.toString()
      : ticket.userId.toString();

    const isOwner = ticketOwnerId === req.user?.id;
    const isStaff = req.user?.role === 'staff';
    const isMyEventAdmin = req.user?.role === 'event_admin' && req.user.managedEventIds?.includes(ticket.eventId._id.toString());

    if (!isOwner && !isStaff && !isMyEventAdmin) {
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

    // Only staff can mark ticket as used
    if (req.user?.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Only staff can check in tickets' });
    }

    // If staff is assigned to specific events, verify event ID is included
    const managedIds = req.user.managedEventIds || [];
    if (managedIds.length > 0 && !managedIds.includes(ticket.eventId.toString())) {
      return res.status(403).json({ success: false, message: 'You are not assigned to manage tickets for this event.' });
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

    console.log(`[DEBUG] getAllTickets called. User: ${req.user?.email}, Role: ${req.user?.role}, ManagedEventIds: ${JSON.stringify(req.user?.managedEventIds)}`);

    // System admin is not allowed to view tickets
    if (req.user?.role === 'admin') {
      console.log(`[DEBUG] getAllTickets Access Denied: User role is admin`);
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filter: any = {};
    if (status) filter.status = status;

    // Scope to managed events for event_admin or staff (if they have assignments)
    const isEventAdmin = req.user?.role === 'event_admin';
    const isStaff = req.user?.role === 'staff';
    const managedIds = req.user?.managedEventIds || [];

    if (isEventAdmin) {
      const targetEventId = eventId ? new mongoose.Types.ObjectId(eventId) : undefined;
      filter.eventId = targetEventId ? targetEventId : { $in: managedIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
      if (eventId && !managedIds.includes(eventId)) {
        console.log(`[DEBUG] getAllTickets Unauthorized event access for eventId: ${eventId}`);
        return res.status(403).json({ success: false, message: 'Unauthorized event access.' });
      }
    } else if (isStaff) {
      if (managedIds.length > 0) {
        const targetEventId = eventId ? new mongoose.Types.ObjectId(eventId) : undefined;
        filter.eventId = targetEventId ? targetEventId : { $in: managedIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
        if (eventId && !managedIds.includes(eventId)) {
          console.log(`[DEBUG] getAllTickets Staff Unauthorized event access for eventId: ${eventId}`);
          return res.status(403).json({ success: false, message: 'Unauthorized event access.' });
        }
      } else if (eventId) {
        filter.eventId = new mongoose.Types.ObjectId(eventId);
      }
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

    console.log(`[DEBUG] getAllTickets Mongoose Filter: ${JSON.stringify(filter)}`);

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

    console.log(`[DEBUG] getAllTickets Found: ${tickets.length} (Total: ${total})`);

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    console.error(`[DEBUG] getAllTickets Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};
