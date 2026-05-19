import { Response } from 'express';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth';

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

    // Set availableSeats = totalSeats khi tạo mới
    if (eventData.totalSeats && !eventData.availableSeats) {
      eventData.availableSeats = eventData.totalSeats;
    }

    const event = await Event.create(eventData);

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
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
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
