import api from './api';

/**
 * Ticket Service - API calls cho tickets
 */
export const ticketService = {
  /** Lấy vé của user */
  getMyTickets: async (status?: string) => {
    const res = await api.get('/api/tickets/my', { params: status ? { status } : {} });
    return res.data;
  },

  /** Lấy chi tiết vé */
  getTicketByCode: async (ticketCode: string) => {
    const res = await api.get(`/api/tickets/code/${ticketCode}`);
    return res.data;
  },

  /** Verify vé (public) */
  verifyTicket: async (ticketCode: string) => {
    const res = await api.get(`/api/tickets/verify/${ticketCode}`);
    return res.data;
  },

  /** Lấy tất cả vé (admin) */
  getAllTickets: async (params?: { status?: string; eventId?: string; page?: number }) => {
    const res = await api.get('/api/tickets', { params });
    return res.data;
  },

  /** Đánh dấu vé đã sử dụng (admin) */
  markUsed: async (ticketCode: string) => {
    const res = await api.patch(`/api/tickets/${ticketCode}/use`);
    return res.data;
  },
};
