import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generateOTP, getOTPExpirationTime, isOTPExpired } from '../utils/otp';
import { sendPasswordResetOTP, sendWelcomeEmail } from '../utils/sendEmail';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validation';

/**
 * Auth Controller - Handles all authentication logic
 */

/**
 * Generate JWT token
 */
const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
} as const);

/**
 * POST /api/auth/register
 * Register a new user and send verification OTP
 */
export const register = async (req: any, res: Response) => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { name, email, password, phone } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please log in or use a different email.',
      });
    }

    // Create new user (verified immediately)
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      isVerified: true,
    });

    // Send welcome email in background (fire-and-forget)
    sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.error('❌ Failed to send welcome email to new user:', err);
    });

    // Generate JWT token
    const token = generateToken(newUser._id.toString(), newUser.email, newUser.role);

    // Set httpOnly cookie
    res.cookie('accessToken', token, getAuthCookieOptions());

    // Don't return password
    const userResponse = newUser.toObject();
    delete (userResponse as any).password;

    return res.status(201).json({
      success: true,
      message: 'Registration successful and logged in.',
      data: {
        id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        phone: userResponse.phone,
        role: userResponse.role,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP during registration
 */
export const verifyOTP = async (req: any, res: Response) => {
  try {
    // Validate input
    const validation = verifyOTPSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email, otp } = validation.data;

    // Find user with unverified email
    const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. Please log in.',
      });
    }

    // Check if OTP has expired
    if (isOTPExpired(user.verificationOTPExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please register again.',
      });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    // Mark email as verified
    user.isVerified = true;
    // user.verificationOTP = undefined;
    // user.verificationOTPExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Set httpOnly cookie
    res.cookie('accessToken', token, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. Welcome!',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed. Please try again.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * Login user
 */
export const login = async (req: any, res: Response) => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email, password } = validation.data;

    // Find user and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email first.',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Set httpOnly cookie
    res.cookie('accessToken', token, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset OTP
 */
export const forgotPassword = async (req: any, res: Response) => {
  try {
    // Validate input
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email } = validation.data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If email exists, password reset OTP has been sent.',
      });
    }

    // Generate reset OTP
    const otp = generateOTP();
    const otpExpires = getOTPExpirationTime();

    // Update reset OTP without re-validating hidden fields like password
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordOTP: otp,
          resetPasswordExpires: otpExpires,
        },
      }
    );

    // Send reset OTP email in the background (fire-and-forget)
    sendPasswordResetOTP(email, user.name, otp).catch((err) => {
      console.error('❌ [Background] Failed to send password reset OTP:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message?.includes('timed out')
        ? 'Email service is taking too long. Please try again later.'
        : 'Failed to process password reset request.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/verify-reset-otp
 * Verify OTP for password reset
 */
export const verifyResetOTP = async (req: any, res: Response) => {
  try {
    // Validate input
    const validation = verifyOTPSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email, otp } = validation.data;

    // Find user with reset OTP
    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if OTP has expired
    if (isOTPExpired(user.resetPasswordExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
      data: {
        email: user.email,
        resetToken: `${email}:${otp}`, // Simple token for verification
      },
    });
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password with new password
 */
export const resetPassword = async (req: any, res: Response) => {
  try {
    // Validate input
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email, otp, newPassword } = validation.data;

    // Find user with reset OTP
    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if OTP has expired
    if (isOTPExpired(user.resetPasswordExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    // Update password and mark email as verified (since they verified email ownership via OTP)
    user.password = newPassword;
    user.isVerified = true;
    // user.resetPasswordOTP = undefined;
    // user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user
 */
export const logout = async (_req: AuthRequest, res: Response) => {
  try {
    // Clear httpOnly cookie - must use SAME options as when it was set
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { name, phone, avatar } = validation.data;

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.name = name;
    if (phone !== undefined) {
      user.phone = phone;
    }
    if (avatar !== undefined) {
      user.avatar = (avatar || undefined) as any;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/auth/change-password
 * Change current user password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { oldPassword, newPassword } = validation.data;

    const user = await User.findById(req.user?.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu cũ không chính xác.',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: error.message,
    });
  }
};


/**
 * POST /api/auth/create-event-admin (super admin only)
 */
export const createEventAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống.' });
    }
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'event_admin',
      isVerified: true, // Auto verified
      managedEventIds: [],
    });
    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản Event Admin thành công.',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Lỗi server.', error: error.message });
  }
};

/**
 * GET /api/auth/event-admins (super admin only)
 */
export const getEventAdmins = async (_req: AuthRequest, res: Response) => {
  try {
    const admins = await User.find({ role: 'event_admin' }).select('-password -__v').populate('managedEventIds', 'title');
    return res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Lỗi server.', error: error.message });
  }
};

/**
 * POST /api/auth/assign-event-admin (super admin only)
 */
export const assignEventAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { email, eventIds } = req.body;
    if (!email || !eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Email and eventIds (array) are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot assign event_admin role to a super admin.' });
    }
    if (eventIds.length > 1) {
      return res.status(400).json({ success: false, message: 'Mỗi Event Admin chỉ được quản lý tối đa 1 sự kiện cùng lúc.' });
    }
    if (user.managedEventIds && user.managedEventIds.length > 0) {
      const existingIdStr = (user.managedEventIds || [])[0]?.toString();
      if (existingIdStr !== eventIds[0]) {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản này đã được gán cho một sự kiện khác. Mỗi Event Admin chỉ được quản lý 1 sự kiện.',
        });
      }
    }
    
    // Auto-revoke this event from any other event_admin to ensure 1 event -> 1 admin
    const eventObjId = new (require('mongoose').Types.ObjectId)(eventIds[0]);
    await User.updateMany(
      { role: 'event_admin', managedEventIds: eventObjId },
      { $pull: { managedEventIds: eventObjId } }
    );

    user.role = 'event_admin';
    user.managedEventIds = [eventObjId]; // Override entirely since each admin gets max 1 event
    await user.save();
    return res.status(200).json({
      success: true,
      message: `User ${user.name} has been assigned as event admin.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        managedEventIds: user.managedEventIds?.map((id: any) => id.toString()),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to assign event admin.', error: error.message });
  }
};

/**
 * POST /api/auth/revoke-event-admin (super admin only)
 */
export const revokeEventAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { email, eventId } = req.body;
    if (!email || !eventId) {
      return res.status(400).json({ success: false, message: 'Email and eventId are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.managedEventIds = (user.managedEventIds || []).filter((id: any) => id.toString() !== eventId);
    if (user.managedEventIds.length === 0) {
      // Optional: keep them as event_admin but with no events, or downgrade them
      // user.role = 'user'; 
    }
    await user.save();
    return res.status(200).json({ success: true, message: 'Đã thu hồi quyền thành công.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to revoke.', error: error.message });
  }
};
