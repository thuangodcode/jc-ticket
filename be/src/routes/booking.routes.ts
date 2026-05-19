import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  adminConfirmBookingPayment,
  cancelBooking,
  getBookingStats,
} from '../controllers/booking.controller';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * Booking Routes - Tất cả đều yêu cầu auth
 */

// User routes
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/stats', protect, adminOnly, getBookingStats);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

// Admin routes
router.get('/', protect, adminOnly, getAllBookings);
router.patch('/:id/payment/admin-confirm', protect, adminOnly, adminConfirmBookingPayment);
router.patch('/:id/confirm', protect, adminOnly, adminConfirmBookingPayment);

export default router;
