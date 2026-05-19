import api from './api';

/**
 * Event Service - API calls cho events
 */
export const eventService = {
  /** Lấy danh sách events */
  getEvents: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  }) => {
    const res = await api.get('/api/events', { params });
    return res.data;
  },

  /** Lấy chi tiết 1 event */
  getEventById: async (id: string) => {
    const res = await api.get(`/api/events/${id}`);
    return res.data;
  },

  /** Tạo event mới (admin) */
  createEvent: async (data: any) => {
    const res = await api.post('/api/events', data);
    return res.data;
  },

  /** Cập nhật event (admin) */
  updateEvent: async (id: string, data: any) => {
    const res = await api.put(`/api/events/${id}`, data);
    return res.data;
  },

  /** Xóa event (admin) */
  deleteEvent: async (id: string) => {
    const res = await api.delete(`/api/events/${id}`);
    return res.data;
  },
};
