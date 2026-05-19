import api from './api';

/**
 * Booking Service - API calls cho bookings
 */
export const bookingService = {
  /** Tạo booking mới */
  createBooking: async (data: {
    eventId: string;
    tickets: { ticketType: string; quantity: number; unitPrice: number }[];
    selectedSeats: string[];
    passengerInfo: { name: string; email: string; phone: string };
  }) => {
    const res = await api.post('/api/bookings', data);
    return res.data;
  },

  /** Lấy bookings của user */
  getMyBookings: async () => {
    const res = await api.get('/api/bookings/my');
    return res.data;
  },

  /** Lấy chi tiết booking */
  getBookingById: async (id: string) => {
    const res = await api.get(`/api/bookings/${id}`);
    return res.data;
  },

  /** Lấy tất cả bookings (admin) */
  getAllBookings: async (params?: { status?: string; paymentStatus?: string; page?: number }) => {
    const res = await api.get('/api/bookings', { params });
    return res.data;
  },

  /** Admin confirm booking */
  confirmBooking: async (id: string) => {
    const res = await api.patch(`/api/bookings/${id}/confirm`);
    return res.data;
  },

  /** Hủy booking */
  cancelBooking: async (id: string) => {
    const res = await api.patch(`/api/bookings/${id}/cancel`);
    return res.data;
  },

  /** Thống kê (admin) */
  getStats: async () => {
    const res = await api.get('/api/bookings/stats');
    return res.data;
  },
};
