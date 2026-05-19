import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * Event Routes
 * Public: GET list + detail
 * Admin: POST, PUT, DELETE
 */

// Public
router.get('/', getEvents);
router.get('/:id', getEventById);

// Admin only
router.post('/', protect, adminOnly, createEvent);
router.put('/:id', protect, adminOnly, updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

export default router;
