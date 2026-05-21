import { Router } from 'express';
import {
  createPayOSOrder,
  payosWebhook,
  checkPayOSStatus,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth';

const router = Router();

/**
 * Payment Routes
 * PayOS only
 */

// PayOS
router.post('/payos/create', protect, createPayOSOrder);
router.post('/payos/webhook', payosWebhook);
router.get('/payos/status/:bookingId', protect, checkPayOSStatus);

export default router;
