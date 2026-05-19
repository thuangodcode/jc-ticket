import { Router } from 'express';
import {
  createZaloPayOrder,
  zaloPayCallback,
  checkZaloPayStatus,
  processPayment,
  verifyPayment,
  refundPayment,
  createVNPayOrder,
  vnpayReturn,
  vnpayIPN,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth';

const router = Router();

/**
 * Payment Routes
 * ZaloPay + VNPay + fallback methods
 */

// ZaloPay
router.post('/zalopay/create', protect, createZaloPayOrder);
router.post('/zalopay/callback', zaloPayCallback);     // No auth - webhook
router.get('/zalopay/status/:appTransId', protect, checkZaloPayStatus);

// VNPay
router.post('/vnpay/create', protect, createVNPayOrder);
router.get('/vnpay/return', vnpayReturn as any);        // No auth - redirect from VNPay
router.get('/vnpay/ipn/ping', (_req, res) => {
  res.json({
    ok: true,
    message: 'VNPay IPN endpoint is reachable via ngrok',
    ipnUrl: '/api/payment/vnpay/ipn',
    timestamp: new Date().toISOString(),
  });
});
router.get('/vnpay/ipn', vnpayIPN as any);              // No auth - IPN webhook
router.post('/vnpay/ipn', vnpayIPN as any);             // Support both GET/POST

// Fallback payment methods
router.post('/process', protect, processPayment);
router.post('/verify', protect, verifyPayment);
router.post('/refund', protect, refundPayment);

export default router;
