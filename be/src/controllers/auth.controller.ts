import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generateOTP, getOTPExpirationTime, isOTPExpired } from '../utils/otp';
import { sendVerificationOTP, sendPasswordResetOTP } from '../utils/sendEmail';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = getOTPExpirationTime();

    // Create new user (not verified yet)
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      isVerified: false,
      verificationOTP: otp,
      verificationOTPExpires: otpExpires,
    });

    // Send verification OTP email
    await sendVerificationOTP(email, name, otp);

    // Don't return password or OTP
    const userResponse = newUser.toObject();
    delete (userResponse as any).password;
    delete (userResponse as any).verificationOTP;
    delete (userResponse as any).verificationOTPExpires;

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for verification OTP.',
      data: {
        email: userResponse.email,
        phone: userResponse.phone,
        requiresVerification: true,
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

    // Send reset OTP email
    await sendPasswordResetOTP(email, user.name, otp);

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

    // Update password
    user.password = newPassword;
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
