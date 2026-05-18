import { Router } from 'express';
import {
  register,
  verifyOTP,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  otpLimiter,
} from '../middleware/rateLimiter';

/**
 * Auth Routes
 * Public routes: register, login, forgotPassword
 * Protected routes: logout, getCurrentUser
 */

const router = Router();

/**
 * Public Routes
 */

/**
 * POST /api/auth/register
 * Register a new user and send verification OTP
 * Rate limited: 3 attempts per hour
 */
router.post('/register', registerLimiter, register);

/**
 * POST /api/auth/verify-otp
 * Verify OTP during registration
 * Rate limited: 10 attempts per 15 minutes
 */
router.post('/verify-otp', otpLimiter, verifyOTP);

/**
 * POST /api/auth/login
 * Login user
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/login', loginLimiter, login);

/**
 * POST /api/auth/forgot-password
 * Send password reset OTP
 * Rate limited: 3 attempts per hour
 */
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

/**
 * POST /api/auth/verify-reset-otp
 * Verify OTP for password reset
 * Rate limited: 10 attempts per 15 minutes
 */
router.post('/verify-reset-otp', otpLimiter, verifyResetOTP);

/**
 * POST /api/auth/reset-password
 * Reset password with new password
 */
router.post('/reset-password', resetPassword);

/**
 * Protected Routes
 */

/**
 * POST /api/auth/logout
 * Logout user - requires authentication
 */
router.post('/logout', protect, logout);

/**
 * GET /api/auth/me
 * Get current user profile - requires authentication
 */
router.get('/me', protect, getCurrentUser);

export default router;
