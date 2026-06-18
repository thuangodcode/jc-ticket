import api from './api';

export interface ChatMessage {
  _id: string;
  room: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'staff';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  room: string;
  lastMessage: string;
  lastMessageSender: string;
  lastMessageRole: 'user' | 'admin' | 'staff';
  lastMessageAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    phone?: string;
    role?: string;
  };
}

export const chatService = {
  /**
   * Lấy lịch sử tin nhắn của một phòng chat
   */
  getHistory: async (room: string): Promise<ChatMessage[]> => {
    const res = await api.get<{ success: boolean; data: ChatMessage[] }>(`/api/chat/history/${room}`);
    return res.data.success ? res.data.data : [];
  },

  /**
   * Lấy danh sách các phòng chat đang hoạt động (Staff/Admin)
   */
  getActiveRooms: async (): Promise<ChatRoom[]> => {
    const res = await api.get<{ success: boolean; data: ChatRoom[] }>('/api/chat/rooms');
    return res.data.success ? res.data.data : [];
  },
};

export default chatService;
