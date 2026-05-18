import { Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import moment from 'moment';
import qs from 'qs';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';

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
    : 'http://localhost:5173/payment/result',
};

/**
 * Generate HMAC-SHA256 signature for ZaloPay
 */
const hmacSHA256 = (data: string, key: string): string => {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

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
    booking.paymentMethod = 'wallet' as any;
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

    if (booking.paymentStatus !== 'successful') {
      booking.paymentStatus = 'successful';
      booking.paymentMethod = 'wallet' as any; // ZaloPay treated as wallet
      booking.paymentId = app_trans_id;
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      await booking.save();

      console.log(
        `✅ ZaloPay callback: booking ${booking.bookingCode} confirmed. Amount: ${amount}`
      );
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

    booking.paymentStatus = 'successful';
    booking.paymentId = transactionId;
    booking.paymentMethod = paymentMethod;
    if (paymentMethod !== 'bank_transfer') {
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
    }
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully.',
      data: {
        bookingId: booking._id,
        paymentId: transactionId,
        amount,
        paymentMethod,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
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

function sortObject(obj: any) {
  let sorted: any = {};
  let keys: string[] = [];
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  keys.sort();
  
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

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

    // ==================== FIX IP ====================
    let ipAddr = req.headers['x-forwarded-for'] ||
                 req.socket.remoteAddress ||
                 req.connection?.remoteAddress ||
                 '127.0.0.1';

    if (Array.isArray(ipAddr)) ipAddr = ipAddr[0] || '127.0.0.1';
    if (ipAddr === '::1' || ipAddr.includes('::ffff:')) {
      ipAddr = '127.0.0.1';
    }

    const tmnCode = process.env.VNP_TMNCODE!;
    const secretKey = process.env.VNP_HASHSECRET!;
    const vnpUrl = process.env.VNP_URL!;
    const returnUrl = process.env.VNP_RETURNURL!;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');
    const orderId = booking._id.toString();
    const amount = booking.totalPrice;

    let vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'billpayment',
      vnp_Amount: Math.round(amount * 100),        // Quan trọng: nhân 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    // DEBUG: alternate signing method (encode values then replace %20 -> +)
    const altPairs: string[] = [];
    for (const k of Object.keys(vnp_Params)) {
      const v = vnp_Params[k];
      const keyEnc = encodeURIComponent(k);
      const valEnc = encodeURIComponent(String(v)).replace(/%20/g, '+');
      altPairs.push(`${keyEnc}=${valEnc}`);
    }
    const altSignData = altPairs.join('&');
    const altHmac = crypto.createHmac('sha512', secretKey);
    const altSigned = altHmac.update(Buffer.from(altSignData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHashType'] = 'SHA512';
    // Try sending lowercase hash and unencoded final URL (matches signData)
    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    console.log('💳 [Payment] Sign Data:', signData);
    console.log('💳 [Payment] Generated Hash:', signed);
    console.log('💳 [Payment] Alt Sign Data:', altSignData);
    console.log('💳 [Payment] Alt Generated Hash:', altSigned);
    console.log('💳 [Payment] IP Used:', ipAddr);

    return res.status(200).json({
      success: true,
      message: 'VNPay URL generated successfully',
      data: { orderUrl: paymentUrl }
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
    
    let vnp_Params = req.query as any;

    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const secretKey = process.env.VNP_HASHSECRET!;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    const orderId = vnp_Params['vnp_TxnRef'] as string;
    const responseCode = vnp_Params['vnp_ResponseCode'];

    console.log('✔️ Return SecureHash (received):', secureHash);
    console.log('✔️ Return Signed (computed):', signed);
    console.log('✔️ Signature Match (case-insensitive):', signed.toLowerCase() === String(secureHash).toLowerCase());

    if (signed === secureHash || signed.toLowerCase() === String(secureHash).toLowerCase()) {
      const booking = await Booking.findById(orderId);
      if (booking) {
        if (responseCode === '00' && booking.paymentStatus !== 'successful') {
          // Success
          booking.paymentStatus = 'successful';
          booking.status = 'confirmed';
          booking.paymentId = vnp_Params['vnp_TransactionNo'] as string;
          booking.confirmedAt = new Date();
          await booking.save();
          console.log(`✅ Return: Booking ${orderId} marked as successful`);
        } else if (responseCode !== '00' && booking.paymentStatus === 'pending') {
          booking.paymentStatus = 'failed';
          await booking.save();
          console.log(`❌ Return: Booking ${orderId} marked as failed`);
        }
      }
      return res.status(200).json({
        success: responseCode === '00',
        message: responseCode === '00' ? 'Payment successful' : 'Payment failed',
        data: {
          code: responseCode,
          orderId
        }
      });
    } else {
      console.error('❌ Return: Invalid signature');
      return res.status(200).json({ success: false, message: 'Invalid signature' });
    }
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
    console.log('📨 [IPN] Body:', req.body);
    console.log('📨 [IPN] VNP_HASHSECRET:', process.env.VNP_HASHSECRET);
    
    // Accept parameters from query (GET) or body (POST)
    let vnp_Params = { ...(req.query as any), ...(req.body as any) };

    console.log('📨 [IPN] Merged Params:', vnp_Params);

    const secureHash = vnp_Params['vnp_SecureHash'] as string;

    if (!secureHash) {
      console.error('❌ [IPN] Missing vnp_SecureHash');
      return res.status(200).json({
        RspCode: '97',
        Message: 'Invalid signature',
      });
    }

    console.log('📨 [IPN] Received Hash:', secureHash);

    // Remove hash fields
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Convert all params to strings (important!)
    for (let key in vnp_Params) {
      vnp_Params[key] = String(vnp_Params[key]);
    }

    console.log('📨 [IPN] Params before sort:', vnp_Params);

    // Sort params
    vnp_Params = sortObject(vnp_Params);

    console.log('📨 [IPN] Params after sort:', vnp_Params);

    // Create sign data
    const signData = qs.stringify(vnp_Params, {
      encode: false,
    });

    console.log('📨 [IPN] Sign Data String:', signData);

    // Create HMAC
    const secretKey = process.env.VNP_HASHSECRET!;
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('📨 [IPN] Expected Hash:', signed);
    console.log('📨 [IPN] Received Hash:', secureHash);
    console.log('📨 [IPN] Hash Match:', signed === secureHash);
    console.log('📨 [IPN] Hash Match (lowercase):', signed.toLowerCase() === secureHash.toLowerCase());

    // Verify signature
    // Accept test calls with dummy hash 'hash_test' from VNPAY admin panel
    const isTestCall = secureHash === 'hash_test' || vnp_Params['vnp_TxnRef'] === '222222';
    
    if (isTestCall || secureHash === signed || secureHash.toLowerCase() === signed.toLowerCase()) {
      const orderId = vnp_Params['vnp_TxnRef'] as string;
      const responseCode = vnp_Params['vnp_ResponseCode'];

      console.log(`✅ [IPN] Signature verified! Order: ${orderId}, Code: ${responseCode}, IsTestCall: ${isTestCall}`);

      // For real calls, update booking. For test calls, just return success
      if (!isTestCall) {
        const booking = await Booking.findById(orderId);

        if (booking) {
          if (booking.paymentStatus !== 'successful' && responseCode === '00') {
            booking.paymentStatus = 'successful';
            booking.status = 'confirmed';
            booking.paymentId = vnp_Params['vnp_TransactionNo'] as string;
            booking.confirmedAt = new Date();
            await booking.save();
            console.log(`✅ [IPN] Booking ${orderId} marked as successful`);
          }
        } else {
          console.warn(`⚠️ [IPN] Booking ${orderId} not found`);
        }
      } else {
        console.log(`📝 [IPN] Test call - skipping booking update`);
      }

      return res.status(200).json({
        RspCode: '00',
        Message: 'success',
      });
    }

    console.error('❌ [IPN] Signature mismatch');
    return res.status(200).json({
      RspCode: '97',
      Message: 'Invalid signature',
    });
  } catch (error: any) {
    console.error('🔥 [IPN] Error:', error.message, error.stack);
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error',
    });
  }
};
