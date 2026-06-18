import api from './api';

export interface SubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    subscribedAt: string;
  };
}

export const subscribeNewsletter = async (email: string): Promise<SubscribeResponse> => {
  const response = await api.post<SubscribeResponse>('/api/newsletter/subscribe', { email });
  return response.data;
};
