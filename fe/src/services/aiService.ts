import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

/**
 * AI Service — Handles calls to both User AI and Admin AI endpoints
 */
export const aiService = {
  /**
   * User AI Chat
   * POST /api/ai/user-chat
   * Optional auth — pass history for multi-turn conversation
   */
  userChat: async (message: string, history: ChatMessage[] = []) => {
    const res = await api.post('/api/ai/user-chat', { message, history });
    return res.data as { success: boolean; reply: string };
  },

  /**
   * Admin AI Chat
   * POST /api/ai/admin-chat
   * Requires admin auth
   */
  adminChat: async (message: string, history: ChatMessage[] = []) => {
    const res = await api.post('/api/ai/admin-chat', { message, history });
    return res.data as { success: boolean; reply: string };
  },
};
