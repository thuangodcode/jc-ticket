import { Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { confirmBookingAndIssueTickets } from '../services/bookingPayment.service';
import { buildVNPayUrl, getVnpReturnUrl, verifyVnpaySignature } from '../config/vnpay.client';
import { findBookingByTxnRef } from '../utils/bookingLookup';
/**
 * Payment Controller - Handles payment processing
 * Supports: ZaloPay Sandbox + fallback methods (wallet, bank_transfer)
 */

// ─────────────────────────────────────────────────────────────────────────────
// ZaloPay Config (Sandbox Demo credentials – replace with real ones)
// ─────────────────────────────────────────────────────────────────────────────
const ZALOPAY_CONFIG = {
  app_id: process.env.ZALOPAY_APP_ID || '2554',
  key1: process.env.ZALOPAY_KEY1 || 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
  key2: process.env.ZALOPAY_KEY2 || 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhR',
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2',
  callback_url: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:5000/api/payment/zalopay/callback',
  redirect_url: process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/payment/result`
    : 'http://localhost:5174/payment/result',
};

/**
 * Generate HMAC-SHA256 signature for ZaloPay
 */
const hmacSHA256 = (data: string, key: string): string => {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

const IpnSuccess = { RspCode: '00', Message: 'Confirm Success' };
const IpnFailChecksum = { RspCode: '97', Message: 'Fail checksum' };
const IpnOrderNotFound = { RspCode: '01', Message: 'Order not found' };
const IpnInvalidAmount = { RspCode: '04', Message: 'Invalid amount' };
const IpnOrderAlreadyConfirmed = { RspCode: '02', Message: 'Order already confirmed' };

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/zalopay/create
// Create a ZaloPay order and return the payment URL
// ─────────────────────────────────────────────────────────────────────────────
export const createZaloPayOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    // Find booking and validate ownership
    const booking = await Booking.findById(bookingId).populate('eventId', 'title');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (booking.userId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    if (booking.paymentStatus === 'successful') {
      return res.status(400).json({ success: false, message: 'Booking already paid.' });
    }

    const transId = Math.floor(Math.random() * 1_000_000);
    const appTransId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${transId}`;
    const appTime = Date.now();

    // Amount must be in VND (integer)
    const amount = Math.round(booking.totalPrice);

    const embedData = JSON.stringify({
      bookingId: bookingId,
      bookingCode: booking.bookingCode,
      redirecturl: ZALOPAY_CONFIG.redirect_url,
    });

    const items = [
      {
        itemid: bookingId,
        itemname: `JC-Ticket - ${booking.bookingCode}`,
        itemprice: amount,
        itemquantity: 1,
      },
    ];

    // Build MAC string: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const macData = [
      ZALOPAY_CONFIG.app_id,
      appTransId,
      req.user?.id || 'user',
      amount,
      appTime,
      embedData,
      JSON.stringify(items),
    ].join('|');

    const mac = hmacSHA256(macData, ZALOPAY_CONFIG.key1);

    const orderPayload = {
      app_id: Number(ZALOPAY_CONFIG.app_id),
      app_trans_id: appTransId,
      app_user: req.user?.id || 'user',
      app_time: appTime,
      amount,
      item: JSON.stringify(items),
      description: `JC-Ticket - Thanh toán đơn ${booking.bookingCode}`,
      embed_data: embedData,
      bank_code: '',
      callback_url: ZALOPAY_CONFIG.callback_url,
      mac,
    };

    // Call ZaloPay API
    const zpResponse = await axios.post(`${ZALOPAY_CONFIG.endpoint}/create`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const { return_code, order_url, zp_trans_token } = zpResponse.data;

    if (return_code !== 1) {
      return res.status(400).json({
        success: false,
        message: 'ZaloPay rejected the order. ' + zpResponse.data.return_message,
        raw: zpResponse.data,
      });
    }

    // Save app_trans_id to booking for later verification
    booking.paymentMethod = 'zalopay' as any;
    booking.paymentId = appTransId;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'ZaloPay order created successfully.',
      data: {
        orderUrl: order_url,
        appTransId,
        zpTransToken: zp_trans_token,
        bookingId,
        amount,
      },
    });
  } catch (error: any) {
    console.error('ZaloPay create order error:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ZaloPay order.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/zalopay/callback
// Webhook from ZaloPay after payment (no auth middleware)
// ─────────────────────────────────────────────────────────────────────────────
export const zaloPayCallback = async (req: any, res: Response) => {
  const result: { return_code: number; return_message: string } = {
    return_code: 0,
    return_message: 'error',
  };

  try {
    const { data: dataStr, mac: receivedMac } = req.body;

    // Verify signature
    const expectedMac = hmacSHA256(dataStr, ZALOPAY_CONFIG.key2);
    if (receivedMac !== expectedMac) {
      result.return_code = -1;
      result.return_message = 'mac not equal';
      return res.json(result);
    }

    const dataObj = JSON.parse(dataStr);
    const { app_trans_id, amount, embed_data } = dataObj;

    let bookingId: string | undefined;
    try {
      const embedParsed = JSON.parse(embed_data || '{}');
      bookingId = embedParsed.bookingId;
    } catch {
      // fallback: find by paymentId
    }

    // Find booking by app_trans_id or bookingId
    const booking = bookingId
      ? await Booking.findById(bookingId)
      : await Booking.findOne({ paymentId: app_trans_id });

    if (!booking) {
      result.return_code = 1; // Tell ZaloPay it's fine (idempotent)
      result.return_message = 'booking not found – ignored';
      return res.json(result);
    }

    try {
      const { alreadyConfirmed } = await confirmBookingAndIssueTickets({
        bookingId: booking._id.toString(),
        paymentMethod: 'zalopay',
        paymentId: app_trans_id,
        skipIfAlreadySuccessful: true,
      });

      if (!alreadyConfirmed) {
        console.log(
          `✅ ZaloPay callback: booking ${booking.bookingCode} confirmed. Amount: ${amount}`
        );
      }
    } catch (ticketErr: any) {
      console.error('Ticket generation error (ZaloPay):', ticketErr.message);
    }

    result.return_code = 1;
    result.return_message = 'success';
  } catch (error: any) {
    console.error('ZaloPay callback error:', error.message);
    result.return_code = 0;
    result.return_message = error.message;
  }

  return res.json(result);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/zalopay/status/:appTransId
// Query ZaloPay order status by app_trans_id
// ─────────────────────────────────────────────────────────────────────────────
export const checkZaloPayStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { appTransId } = req.params;
    if (!appTransId) {
      return res.status(400).json({ success: false, message: 'appTransId is required.' });
    }

    const macData = `${ZALOPAY_CONFIG.app_id}|${appTransId}|${ZALOPAY_CONFIG.key1}`;
    const mac = hmacSHA256(macData, ZALOPAY_CONFIG.key1);

    const zpResponse = await axios.post(
      `${ZALOPAY_CONFIG.endpoint}/query`,
      {
        app_id: Number(ZALOPAY_CONFIG.app_id),
        app_trans_id: appTransId,
        mac,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const { return_code } = zpResponse.data;

    // Sync with local booking if paid
    if (return_code === 1) {
      await Booking.findOneAndUpdate(
        { paymentId: appTransId, paymentStatus: { $ne: 'successful' } },
        {
          paymentStatus: 'successful',
          status: 'confirmed',
          confirmedAt: new Date(),
        }
      );
    }

    return res.status(200).json({
      success: true,
      data: zpResponse.data,
    });
  } catch (error: any) {
    console.error('ZaloPay status check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to query ZaloPay status.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/process  (wallet / bank_transfer fallback)
// ─────────────────────────────────────────────────────────────────────────────
export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, paymentMethod, amount } = req.body;

    if (!bookingId || !paymentMethod || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required payment fields.' });
    }

    const validMethods = ['card', 'wallet', 'bank_transfer'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (booking.userId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    if (booking.paymentStatus === 'successful') {
      return res.status(400).json({ success: false, message: 'Booking already paid.' });
    }

    const transactionId = `${paymentMethod.toUpperCase()}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    let savedBooking = booking;

    if (paymentMethod === 'bank_transfer') {
      savedBooking.paymentMethod = paymentMethod as any;
      savedBooking.paymentId = transactionId;
      savedBooking.paymentStatus = 'pending';
      savedBooking.status = 'pending';
      await savedBooking.save();
    } else {
      const { booking: confirmedBooking } = await confirmBookingAndIssueTickets({
        bookingId: booking._id.toString(),
        paymentMethod,
        paymentId: transactionId,
        skipIfAlreadySuccessful: true,
      });
      savedBooking = confirmedBooking as any;
    }

    return res.status(200).json({
      success: true,
      message: paymentMethod === 'bank_transfer'
        ? 'Đơn hàng đã được ghi nhận. Vui lòng chuyển khoản và chờ admin xác nhận.'
        : 'Payment processed successfully.',
      data: {
        bookingId: savedBooking._id,
        paymentId: transactionId,
        amount,
        paymentMethod,
        status: savedBooking.status,
        paymentStatus: savedBooking.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment processing failed.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, transactionId } = req.body;
    if (!bookingId || !transactionId) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isValid =
      booking.paymentId === transactionId && booking.paymentStatus === 'successful';

    return res.status(isValid ? 200 : 400).json({
      success: isValid,
      message: isValid ? 'Payment verified.' : 'Payment verification failed.',
      data: isValid
        ? { bookingId: booking._id, paymentStatus: booking.paymentStatus, status: booking.status }
        : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Verification failed.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/refund
// ─────────────────────────────────────────────────────────────────────────────
export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (booking.userId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    if (booking.paymentStatus !== 'successful') {
      return res
        .status(400)
        .json({ success: false, message: 'Only successful payments can be refunded.' });
    }

    booking.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully.',
      data: { bookingId: booking._id, paymentStatus: booking.paymentStatus, status: booking.status },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Refund failed.', error: error.message });
  }
};

// ============================================================================
// VNPAY INTEGRATION
// ============================================================================

/**
 * POST /api/payment/vnpay/create
 * Creates a VNPay payment URL for a booking
 */
export const createVNPayOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'successful') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    let ipAddr =
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    if (ipAddr === '::1' || ipAddr.startsWith('::ffff:') || ipAddr === '127.0.0.1') {
      ipAddr = '113.160.92.202';
    }

    const normalizedOrderInfo = `Thanh toan don hang ${booking.bookingCode}`
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    booking.paymentMethod = 'vnpay' as any;
    booking.paymentStatus = 'pending';
    await booking.save();

    // ✅ Dùng buildVNPayUrl tự implement — ký raw string đúng chuẩn VNPAY
    // Thư viện `vnpay` v2.5.0 ký URLSearchParams.toString() (đã encode)
    // nhưng VNPAY server verify theo raw string → sai chữ ký
    const paymentUrl = buildVNPayUrl({
      amount: Math.round(Number(booking.totalPrice)),
      txnRef: booking.bookingCode,
      orderInfo: normalizedOrderInfo,
      returnUrl: getVnpReturnUrl(),
      ipAddr,
    });

    console.log('💳 [VNPay] TxnRef:', booking.bookingCode);
    console.log('💳 [VNPay] Amount (VND):', booking.totalPrice);
    console.log('💳 [VNPay] ReturnUrl:', getVnpReturnUrl());
    console.log('💳 [VNPay] TmnCode:', process.env.VNP_TMNCODE);
    console.log('💳 [VNPay] Secret loaded:', Boolean(process.env.VNP_HASHSECRET?.trim()));
    console.log('💳 [VNPay] Payment URL:', paymentUrl);

    return res.status(200).json({
      success: true,
      message: 'VNPay URL generated successfully',
      data: { orderUrl: paymentUrl },
    });
  } catch (error: any) {
    console.error('VNPay Create Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/payment/vnpay/return
 * Check VNPay status and update booking
 */
export const vnpayReturn = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 VNPay Return - Query Params:', JSON.stringify(req.query, null, 2));

    const verify = verifyVnpaySignature(req.query as any);
    console.log('✔️ Return verified:', verify.isVerified, '| success:', verify.isSuccess);

    if (verify.isVerified) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const status = String(verify.vnp_ResponseCode) === '00' ? '1' : '0';
      const redirectUrl = `${frontendUrl}/payment/result?status=${status}&orderId=${encodeURIComponent(String(verify.vnp_TxnRef))}&source=vnpay`;

      return res.redirect(302, redirectUrl);
    }

    console.error('❌ Return: Invalid signature');
    return res.status(200).json({ success: false, message: 'Invalid signature' });
  } catch (error: any) {
    console.error('🔥 VNPay Return Error:', error);
    return res.status(200).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * GET/POST /api/payment/vnpay/ipn
 * IPN Webhook for VNPay Server
 */
export const vnpayIPN = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📨 [IPN] Method:', req.method);
    console.log('📨 [IPN] Query:', req.query);

    const query = req.query as Record<string, string>;
    const receivedHash = String(query.vnp_SecureHash ?? '');
    const orderInfo = String(query.vnp_OrderInfo ?? '');

    // VNPay merchant portal "Test call IPN" sends hash_test (not a real HMAC) — only checks URL reachability.
    const isSandboxIpnProbe =
      process.env.NODE_ENV !== 'production' &&
      receivedHash === 'hash_test' &&
      orderInfo === 'Test_call_ipn';

    if (isSandboxIpnProbe) {
      console.log('📨 [IPN] Sandbox connectivity test OK (hash_test from VNPay portal)');
      return res.status(200).json(IpnSuccess);
    }

    const verify = verifyVnpaySignature(query as any);
    console.log('📨 [IPN] verified:', verify.isVerified, '| success:', verify.isSuccess, '| amount (VND):', verify.vnp_Amount);

    if (!verify.isVerified) {
      console.error('❌ [IPN] Checksum mismatch');
      return res.status(200).json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      return res.status(200).json({ RspCode: '99', Message: 'Payment not successful' });
    }

    const txnRef = String(verify.vnp_TxnRef);
    const paidAmountVnd = Math.round(Number(verify.vnp_Amount));

    const booking = await findBookingByTxnRef(txnRef);
    if (!booking) {
      console.warn(`⚠️ [IPN] Booking ${txnRef} not found`);
      return res.status(200).json(IpnOrderNotFound);
    }

    const expectedAmountVnd = Math.round(booking.totalPrice);
    if (paidAmountVnd !== expectedAmountVnd) {
      console.warn(`⚠️ [IPN] Invalid amount. Expected ${expectedAmountVnd} VND, got ${paidAmountVnd} VND`);
      return res.status(200).json(IpnInvalidAmount);
    }

    if (booking.paymentStatus === 'successful' || booking.status === 'confirmed') {
      return res.status(200).json(IpnOrderAlreadyConfirmed);
    }

    const responseCode = String(verify.vnp_ResponseCode);
    const transactionStatus = verify.vnp_TransactionStatus != null ? String(verify.vnp_TransactionStatus) : '';

    if (responseCode === '00' || transactionStatus === '00') {
      try {
        const txnNo = verify.vnp_TransactionNo != null ? String(verify.vnp_TransactionNo) : undefined;
        await confirmBookingAndIssueTickets({
          bookingId: booking._id.toString(),
          paymentMethod: 'vnpay',
          ...(txnNo ? { paymentId: txnNo } : {}),
          skipIfAlreadySuccessful: true,
        });
        console.log(`✅ [IPN] Booking ${txnRef} confirmed`);
      } catch (ticketErr: any) {
        console.error('Ticket generation error (VNPay IPN):', ticketErr.message);
      }
    } else {
      booking.paymentStatus = 'failed';
      booking.paymentMethod = 'vnpay' as any;
      await booking.save();
      console.log(`❌ [IPN] Booking ${txnRef} marked as failed`);
    }

    return res.status(200).json(IpnSuccess);
  } catch (error: any) {
    console.error('🔥 [IPN] Error:', error.message, error.stack);
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error',
    });
  }
};
