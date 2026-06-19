import { Response } from 'express';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const DEFAULT_SEATS_PER_ROW = 12;

const getCommonDivisors = (value: number) => {
  const divisors = new Set<number>();
  const limit = Math.floor(Math.sqrt(value));

  for (let i = 1; i <= limit; i += 1) {
    if (value % i === 0) {
      divisors.add(i);
      divisors.add(value / i);
    }
  }

  return Array.from(divisors).sort((a, b) => a - b);
};

const normalizeSeatMapFromTicketTypes = (ticketTypes: any[], seatMap: any) => {
  const totalSeats = ticketTypes.reduce((sum, type) => sum + (Number(type.quantity) || 0), 0);
  const vipSeats = ticketTypes
    .filter((type) => String(type.name || '').trim().toLowerCase() === 'vip')
    .reduce((sum, type) => sum + (Number(type.quantity) || 0), 0);

  const currentSeatsPerRow = Number(seatMap?.seatsPerRow) || DEFAULT_SEATS_PER_ROW;
  const candidates = getCommonDivisors(Math.max(1, totalSeats)).filter((divisor) => vipSeats === 0 || vipSeats % divisor === 0);
  let seatsPerRow = currentSeatsPerRow;

  if (candidates.length > 0) {
    let bestCandidate = candidates[0]!;
    const target = currentSeatsPerRow || DEFAULT_SEATS_PER_ROW;

    for (const candidate of candidates) {
      const bestDistance = Math.abs(bestCandidate - target);
      const candidateDistance = Math.abs(candidate - target);

      if (candidateDistance < bestDistance) {
        bestCandidate = candidate;
        continue;
      }

      if (candidateDistance === bestDistance && candidate > bestCandidate) {
        bestCandidate = candidate;
      }
    }

    seatsPerRow = bestCandidate;
  }

  const rows = Math.max(1, Math.ceil(totalSeats / seatsPerRow));
  const vipRowCount = vipSeats > 0 ? Math.min(rows, Math.ceil(vipSeats / seatsPerRow)) : 0;

  return {
    rows,
    seatsPerRow,
    vipRows: Array.from({ length: vipRowCount }, (_, index) => index),
    reservedSeats: Array.isArray(seatMap?.reservedSeats) ? seatMap.reservedSeats : [],
  };
};

/**
 * Event Controller - CRUD + listing cho events
 */

/**
 * GET /api/events
 * Lấy danh sách events (public, có filter + pagination)
 */
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      search,
      status = 'active',
      sortBy = 'date',
      sortOrder = 'asc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [events, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(limitNum),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get events error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/:id
 * Lấy chi tiết 1 event (public)
 */
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/events (admin only)
 * Tạo event mới
 */
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventData = req.body;

    if (Array.isArray(eventData.ticketTypes) && eventData.ticketTypes.length > 0) {
      const totalSeats = eventData.ticketTypes.reduce((sum: number, type: any) => sum + (Number(type.quantity) || 0), 0);
      eventData.totalSeats = totalSeats;
      eventData.availableSeats = totalSeats;
      eventData.seatMap = normalizeSeatMapFromTicketTypes(eventData.ticketTypes, eventData.seatMap);
    }

    // Set availableSeats = totalSeats khi tạo mới
    if (eventData.totalSeats && !eventData.availableSeats) {
      eventData.availableSeats = eventData.totalSeats;
    }

    const event = await Event.create(eventData);

    // If creator is event_admin, add event id to their managedEventIds
    if (req.user?.role === 'event_admin') {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { managedEventIds: event._id },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/events/:id (admin only)
 * Cập nhật event
 */
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    // Event admin can only update their managed events
    if (req.user?.role === 'event_admin') {
      const managedIds = req.user.managedEventIds || [];
      if (!req.params.id || !managedIds.includes(req.params.id as string)) {
        return res.status(403).json({ success: false, message: 'You can only edit events assigned to you.' });
      }
    }

    const updateData = { ...req.body };

    if (Array.isArray(updateData.ticketTypes) && updateData.ticketTypes.length > 0) {
      const totalSeats = updateData.ticketTypes.reduce((sum: number, type: any) => sum + (Number(type.quantity) || 0), 0);
      updateData.totalSeats = totalSeats;
      if (typeof updateData.availableSeats !== 'number') {
        updateData.availableSeats = totalSeats;
      } else {
        updateData.availableSeats = Math.min(updateData.availableSeats, totalSeats);
      }
      updateData.seatMap = normalizeSeatMapFromTicketTypes(updateData.ticketTypes, updateData.seatMap);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/events/:id (admin only)
 * Xóa event (soft delete bằng status)
 */
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    // Event admin can only delete their managed events
    if (req.user?.role === 'event_admin') {
      const managedIds = req.user.managedEventIds || [];
      if (!req.params.id || !managedIds.includes(req.params.id as string)) {
        return res.status(403).json({ success: false, message: 'You can only delete events assigned to you.' });
      }
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
