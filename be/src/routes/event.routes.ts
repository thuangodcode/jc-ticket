import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { protect, eventAdminOnly } from '../middleware/auth';

const router = Router();

/**
 * Event Routes
 * Public: GET list + detail
 * Admin: POST, PUT, DELETE
 */

// Public
router.get('/', getEvents);
router.get('/:id', getEventById);

// Event Admin only
router.post('/', protect, eventAdminOnly, createEvent);
router.put('/:id', protect, eventAdminOnly, updateEvent);
router.delete('/:id', protect, eventAdminOnly, deleteEvent);

export default router;
