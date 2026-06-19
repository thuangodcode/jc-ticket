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
  updateProfile,
  changePassword,
  assignEventAdmin,
  revokeEventAdmin,
  getEventAdmins,
  createEventAdmin,
  getAllUsers,
  createUserAccount,
  deleteUserAccount,
  getSystemStats,
} from '../controllers/auth.controller';
import { protect, superAdminOnly } from '../middleware/auth';
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

/**
 * PUT /api/auth/profile
 * Update current user profile - requires authentication
 */
router.put('/profile', protect, updateProfile);

/**
 * PUT /api/auth/change-password
 * Change current user password - requires authentication
 */
router.put('/change-password', protect, changePassword);

/**
 * Event Admin Management Routes (super admin only)
 */
router.post('/create-event-admin', protect, superAdminOnly, createEventAdmin);
router.post('/assign-event-admin', protect, superAdminOnly, assignEventAdmin);
router.post('/revoke-event-admin', protect, superAdminOnly, revokeEventAdmin);
router.get('/event-admins', protect, superAdminOnly, getEventAdmins);

/**
 * User & System Management Routes (super admin only)
 */
router.get('/users', protect, superAdminOnly, getAllUsers);
router.post('/users', protect, superAdminOnly, createUserAccount);
router.delete('/users/:id', protect, superAdminOnly, deleteUserAccount);
router.get('/system-stats', protect, superAdminOnly, getSystemStats);

export default router;
