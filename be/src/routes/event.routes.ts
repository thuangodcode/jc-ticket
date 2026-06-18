import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth';

const router = Router();

/**
 * Event Routes
 * Public: GET list + detail
 * Admin: POST, PUT, DELETE
 */

// Public
router.get('/', getEvents);
router.get('/:id', getEventById);

// Admin only (event_admin can update their own events)
router.post('/', protect, superAdminOnly, createEvent);
router.put('/:id', protect, adminOnly, updateEvent);
router.delete('/:id', protect, superAdminOnly, deleteEvent);

export default router;
