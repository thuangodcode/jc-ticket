import { Router } from 'express';
import {
  getMyTickets,
  getTicketByCode,
  verifyTicket,
  markTicketUsed,
  getAllTickets,
} from '../controllers/ticket.controller';
import { protect, staffOrAdmin } from '../middleware/auth';

const router = Router();

/**
 * Ticket Routes
 */

// Public - verify ticket (QR scan)
router.get('/verify/:ticketCode', verifyTicket);

// User routes (auth required)
router.get('/my', protect, getMyTickets);
router.get('/code/:ticketCode', protect, getTicketByCode);

// Admin routes
router.get('/', protect, staffOrAdmin, getAllTickets);
router.patch('/:ticketCode/use', protect, staffOrAdmin, markTicketUsed);

export default router;
