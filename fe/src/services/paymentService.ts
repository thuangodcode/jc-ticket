import api from './api';

/**
 * Payment Service - PayOS only
 */
export const paymentService = {
  /** Tạo đơn thanh toán PayOS */
  createPayOSOrder: async (bookingId: string) => {
    const res = await api.post('/api/payment/payos/create', { bookingId });
    return res.data;
  },

  /** Kiểm tra trạng thái PayOS */
  checkPayOSStatus: async (bookingId: string) => {
    const res = await api.get(`/api/payment/payos/status/${bookingId}`);
    return res.data;
  },
};
