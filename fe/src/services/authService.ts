/**
 * Auth API Service - Handles all authentication API calls
 * Uses axios to communicate with backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with credentials
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  withCredentials: true, // Include cookies in requests
});

// Request interceptor - attach authorization token if present
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Register user
 */
export const registerUser = async (data: {
  name: string;
  phone: string;
  email: string;
  password: string;
}) => {
  const response = await authAPI.post('/register', data);
  return response.data;
};

/**
 * Verify registration OTP
 */
export const verifyRegistrationOTP = async (data: {
  email: string;
  otp: string;
}) => {
  const response = await authAPI.post('/verify-otp', data);
  return response.data;
};

/**
 * Login user
 */
export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await authAPI.post('/login', data);
  return response.data;
};

/**
 * Forgot password - send OTP
 */
export const forgotPassword = async (data: {
  email: string;
}) => {
  const response = await authAPI.post('/forgot-password', data);
  return response.data;
};

/**
 * Verify reset password OTP
 */
export const verifyResetOTP = async (data: {
  email: string;
  otp: string;
}) => {
  const response = await authAPI.post('/verify-reset-otp', data);
  return response.data;
};

/**
 * Reset password with new password
 */
export const resetPasswordService = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  const response = await authAPI.post('/reset-password', data);
  return response.data;
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  const response = await authAPI.post('/logout');
  return response.data;
};

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async () => {
  const response = await authAPI.get('/me');
  return response.data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (data: {
  name: string;
  phone?: string;
  avatar?: string;
}) => {
  const response = await authAPI.put('/profile', data);
  return response.data;
};

/**
 * Change user password
 */
export const changePassword = async (data: {
  oldPassword?: string;
  newPassword?: string;
}) => {
  const response = await authAPI.put('/change-password', data);
  return response.data;
};

/**
 * Auth Service object - provides clean API for authentication
 * Used by UserAuthContext and components
 */
export const authService = {
  // Registration flow
  register: async (name: string, phone: string, email: string, password: string) => {
    return registerUser({ name, phone, email, password });
  },

  verifyOTP: async (email: string, otp: string) => {
    return verifyRegistrationOTP({ email, otp });
  },

  // Login/Logout
  login: async (email: string, password: string) => {
    return loginUser({ email, password });
  },

  logout: async () => {
    return logoutUser();
  },

  // Session management
  getCurrentUser: async () => {
    return getCurrentUserProfile();
  },

  updateProfile: async (name: string, phone?: string, avatar?: string) => {
    return updateUserProfile({ name, phone, avatar });
  },

  changePassword: async (oldPassword?: string, newPassword?: string) => {
    return changePassword({ oldPassword, newPassword });
  },

  // Password reset flow
  forgotPassword: async (email: string) => {
    return forgotPassword({ email });
  },

  verifyResetOTP: async (email: string, otp: string) => {
    return verifyResetOTP({ email, otp });
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return resetPasswordService({ email, otp, newPassword });
  },
};

export default authAPI;
