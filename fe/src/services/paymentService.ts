import api from './api';

/**
 * Payment Service - API calls cho thanh toán
 */
export const paymentService = {
  /** Tạo đơn thanh toán VNPay */
  createVNPayOrder: async (bookingId: string) => {
    const res = await api.post('/api/payment/vnpay/create', { bookingId });
    return res.data;
  },

  /** Tạo đơn thanh toán ZaloPay */
  createZaloPayOrder: async (bookingId: string) => {
    const res = await api.post('/api/payment/zalopay/create', { bookingId });
    return res.data;
  },

  /** Kiểm tra trạng thái ZaloPay */
  checkZaloPayStatus: async (appTransId: string) => {
    const res = await api.get(`/api/payment/zalopay/status/${appTransId}`);
    return res.data;
  },

  /** Thanh toán fallback (wallet/bank_transfer) */
  processPayment: async (data: {
    bookingId: string;
    paymentMethod: string;
    amount: number;
  }) => {
    const res = await api.post('/api/payment/process', data);
    return res.data;
  },

  /** Verify thanh toán */
  verifyPayment: async (bookingId: string, transactionId: string) => {
    const res = await api.post('/api/payment/verify', { bookingId, transactionId });
    return res.data;
  },
};
