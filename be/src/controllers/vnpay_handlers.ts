import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { verifyVnpaySignature } from '../config/vnpay.client';
import { confirmBookingAndIssueTickets } from '../services/bookingPayment.service';
import { findBookingByTxnRef } from '../utils/bookingLookup';

export const vnpayReturn = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 VNPay Return - Query Params:', JSON.stringify(req.query, null, 2));

    const verify = verifyVnpaySignature(req.query as any);

    console.log('✔️ Return verified:', verify.isVerified, '| success:', verify.isSuccess);

    if (verify.isVerified) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const status = verify.isSuccess ? '1' : '0';
      const redirectUrl =
        `${frontendUrl}/payment/result` +
        `?status=${status}` +
        `&orderId=${encodeURIComponent(verify.vnp_TxnRef)}` +
        `&source=vnpay`;

      return res.redirect(302, redirectUrl);
    }

    console.error('❌ Return: Invalid signature');
    return res.status(200).json({ success: false, message: 'Invalid signature' });
  } catch (error: any) {
    console.error('🔥 VNPay Return Error:', error);
    return res.status(200).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// ─── IPN handler ─────────────────────────────────────────────────────────────

export const vnpayIPN = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📨 [IPN] Method:', req.method);
    console.log('📨 [IPN] Query:', req.query);

    const query = req.query as Record<string, string>;
    const receivedHash = query.vnp_SecureHash ?? '';
    const orderInfo = query.vnp_OrderInfo ?? '';

    // VNPAY merchant portal "Test call IPN" — chỉ kiểm tra reachability
    const isSandboxIpnProbe =
      process.env.NODE_ENV !== 'production' &&
      receivedHash === 'hash_test' &&
      orderInfo === 'Test_call_ipn';

    if (isSandboxIpnProbe) {
      console.log('📨 [IPN] Sandbox connectivity test OK');
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }

    const verify = verifyVnpaySignature(query as any);
    console.log(
      '📨 [IPN] verified:', verify.isVerified,
      '| success:', verify.isSuccess,
      '| amount (VND):', verify.vnp_Amount,
    );

    if (!verify.isVerified) {
      console.error('❌ [IPN] Checksum mismatch');
      return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }

    if (!verify.isSuccess) {
      return res.status(200).json({ RspCode: '99', Message: 'Payment not successful' });
    }

    const txnRef = verify.vnp_TxnRef;
    const paidAmountVnd = verify.vnp_Amount; // đã ÷100

    const booking = await findBookingByTxnRef(txnRef);
    if (!booking) {
      console.warn(`⚠️ [IPN] Booking ${txnRef} not found`);
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    const expectedAmountVnd = Math.round(booking.totalPrice);
    if (paidAmountVnd !== expectedAmountVnd) {
      console.warn(`⚠️ [IPN] Invalid amount. Expected ${expectedAmountVnd} VND, got ${paidAmountVnd} VND`);
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (booking.paymentStatus === 'successful' || booking.status === 'confirmed') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    const responseCode = verify.vnp_ResponseCode;
    const transactionStatus = verify.vnp_TransactionStatus;

    if (responseCode === '00' || transactionStatus === '00') {
      try {
        const txnNo = verify.vnp_TransactionNo ? String(verify.vnp_TransactionNo) : undefined;
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

    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error: any) {
    console.error('🔥 [IPN] Error:', error.message, error.stack);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};