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
    const { status, paymentStatus, page = '1', limit = '20', search } = req.query as Record<string, string>;

    const filter: any = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Event admin: scope to their managed events
    if (req.user?.role === 'event_admin') {
      const managedIds = req.user.managedEventIds || [];
      filter.eventId = { $in: managedIds };
    }

    if (search) {
      filter.$or = [
        { bookingCode: { $regex: search, $options: 'i' } },
        { 'passengerInfo.name': { $regex: search, $options: 'i' } },
        { 'passengerInfo.phone': { $regex: search, $options: 'i' } },
        { 'passengerInfo.email': { $regex: search, $options: 'i' } },
      ];
    }

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

    // Event admin: verify booking belongs to their event
    if (req.user?.role === 'event_admin') {
      const booking = await Booking.findById(bookingId);
      const managedIds = req.user.managedEventIds || [];
      if (!booking || !managedIds.includes(booking.eventId.toString())) {
        return res.status(403).json({ success: false, message: 'You can only manage bookings for your assigned events.' });
      }
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
    if (booking.userId.toString() !== req.user?.id && req.user?.role !== 'admin' && req.user?.role !== 'event_admin') {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Event admin: verify booking belongs to their event
    if (req.user?.role === 'event_admin') {
      const managedIds = req.user.managedEventIds || [];
      if (!managedIds.includes(booking.eventId.toString())) {
        await session.abortTransaction();
        return res.status(403).json({ success: false, message: 'You can only manage bookings for your assigned events.' });
      }
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
export const getBookingStats = async (req: AuthRequest, res: Response) => {
  try {
    // Event admin scope filter
    const isEventAdmin = req.user?.role === 'event_admin';
    const managedIds = req.user?.managedEventIds || [];
    const scopeFilter: any = isEventAdmin ? { eventId: { $in: managedIds.map((id: string) => new (require('mongoose').Types.ObjectId)(id)) } } : {};

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      revenueResult,
    ] = await Promise.all([
      Booking.countDocuments(scopeFilter),
      Booking.countDocuments({ paymentStatus: 'pending', ...scopeFilter }),
      Booking.countDocuments({ paymentStatus: 'successful', ...scopeFilter }),
      Booking.countDocuments({ status: 'cancelled', ...scopeFilter }),
      Booking.aggregate([
        { $match: { paymentStatus: 'successful', ...scopeFilter } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // --- Rolling MoM Trend calculation (Last 30d vs 30d before) ---
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current 30 days
    const [
      curBookings,
      curPending,
      curConfirmed,
      curRevenueResult
    ] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, ...scopeFilter }),
      Booking.countDocuments({ paymentStatus: 'pending', createdAt: { $gte: thirtyDaysAgo }, ...scopeFilter }),
      Booking.countDocuments({ paymentStatus: 'successful', createdAt: { $gte: thirtyDaysAgo }, ...scopeFilter }),
      Booking.aggregate([
        { $match: { paymentStatus: 'successful', createdAt: { $gte: thirtyDaysAgo }, ...scopeFilter } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);
    const curRevenue = curRevenueResult[0]?.total || 0;

    // Previous 30 days
    const [
      prevBookings,
      prevPending,
      prevConfirmed,
      prevRevenueResult
    ] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, ...scopeFilter }),
      Booking.countDocuments({ paymentStatus: 'pending', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, ...scopeFilter }),
      Booking.countDocuments({ paymentStatus: 'successful', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, ...scopeFilter }),
      Booking.aggregate([
        { $match: { paymentStatus: 'successful', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, ...scopeFilter } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);
    const prevRevenue = prevRevenueResult[0]?.total || 0;

    const getTrend = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return parseFloat(((current - previous) / previous * 100).toFixed(1));
    };

    const trends = {
      revenueTrend: getTrend(curRevenue, prevRevenue),
      bookingsTrend: getTrend(curBookings, prevBookings),
      confirmedTrend: getTrend(curConfirmed, prevConfirmed),
      pendingTrend: getTrend(curPending, prevPending),
    };

    // --- 7-Day Daily Sales & Bookings Trend ---
    const startOf7DaysAgo = new Date();
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6);
    startOf7DaysAgo.setHours(0, 0, 0, 0);

    const dailyStatsRaw = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf7DaysAgo },
          ...scopeFilter,
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" }
          },
          revenue: {
            $sum: {
              $cond: [ { $eq: ["$paymentStatus", "successful"] }, "$totalPrice", 0 ]
            }
          },
          bookings: { $sum: 1 },
          paidBookings: {
            $sum: {
              $cond: [ { $eq: ["$paymentStatus", "successful"] }, 1, 0 ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const found = dailyStatsRaw.find(item => item._id === dateStr);
      dailyStats.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
        revenue: found ? found.revenue : 0,
        bookings: found ? found.bookings : 0,
        paidBookings: found ? found.paidBookings : 0,
      });
    }

    // --- Top 5 Events by Revenue & Ticket Sales ---
    const eventStatsRaw = await Booking.aggregate([
      { $match: { paymentStatus: 'successful', ...scopeFilter } },
      {
        $group: {
          _id: '$eventId',
          revenue: { $sum: '$totalPrice' },
          ticketsSold: { $sum: { $size: '$selectedSeats' } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    const eventStats = await Promise.all(
      eventStatsRaw.map(async (item) => {
        const event = await Event.findById(item._id).select('title');
        return {
          eventId: item._id,
          title: event ? event.title : 'Sự kiện khác',
          revenue: item.revenue,
          ticketsSold: item.ticketsSold,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        trends,
        dailyStats,
        eventStats,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
