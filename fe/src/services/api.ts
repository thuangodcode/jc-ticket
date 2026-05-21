import axios from 'axios';

const baseURL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Gửi httpOnly cookies
});

// Response interceptor - handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired hoặc không hợp lệ
      console.warn('🔐 Unauthorized - token may have expired');
    }
    return Promise.reject(error);
  }
);

export default api;