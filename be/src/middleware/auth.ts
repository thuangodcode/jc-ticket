import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Request interface to include user data
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    managedEventIds?: string[];
  };
}

/**
 * Protect middleware - Verify JWT token from httpOnly cookie
 * Used to protect routes that require authentication
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from httpOnly cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    const User = require('../models/User').User;
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: user.role, // Use database fresh role
      managedEventIds: user.managedEventIds?.map((id: any) => id.toString()) || [],
    };

    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
};

/**
 * Admin middleware - Check if user is admin or event_admin
 * Must be used after protect middleware
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'event_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  return next();
};

/**
 * Super Admin middleware - Check if user is the main admin (not event_admin)
 * Must be used after protect middleware
 */
export const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.',
    });
  }

  return next();
};

/**
 * Event Admin middleware - Check if user is event_admin (organizer)
 * Must be used after protect middleware
 */
export const eventAdminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'event_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Event Admin privileges required.',
    });
  }

  return next();
};

/**
 * Staff middleware - Check if user is staff (check-in / helper)
 * Must be used after protect middleware
 */
export const staffOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff privileges required.',
    });
  }

  return next();
};

/**
 * Staff or Event Admin middleware
 * Must be used after protect middleware
 */
export const staffOrEventAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'event_admin' && req.user?.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or Event Admin privileges required.',
    });
  }

  return next();
};

/**
 * Staff or Admin middleware - Check if user is staff or admin
 * Must be used after protect middleware
 */
export const staffOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'event_admin' && req.user?.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or Admin privileges required.',
    });
  }

  return next();
};

/**
 * Validation error handler middleware
 */
export const validationErrorHandler = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error?.issues) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.issues,
    });
  }

  return next();
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.stack }),
  });
};
