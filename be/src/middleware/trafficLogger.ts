import { Request, Response, NextFunction } from 'express';
import { TrafficLog } from '../models/TrafficLog';
import jwt from 'jsonwebtoken';

/**
 * Global traffic logging middleware
 */
export const logTraffic = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Check if the request is a main system access entry point
    const cleanPath = (req.originalUrl || req.path || '').split('?')[0] || '';
    const systemAccessPaths = [
      '/api/auth/me',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/verify-otp'
    ];

    if (!systemAccessPaths.includes(cleanPath)) {
      return next();
    }

    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    const userAgent = req.headers['user-agent'];
    const uaString = Array.isArray(userAgent) ? userAgent[0] : userAgent;
    
    // Attempt to extract user ID from token early for traffic log
    let userId: string | undefined = (req as any).user?.id;
    if (!userId) {
      let token = req.cookies?.accessToken;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          userId = decoded.id;
        } catch (e) {
          // ignore token error
        }
      }
    }

    const logData: any = {
      path: cleanPath,
      method: req.method,
      timestamp: new Date(),
    };

    if (ip) logData.ip = ip;
    if (uaString) logData.userAgent = uaString;
    if (userId) logData.userId = userId;

    // Log the request asynchronously (fire-and-forget)
    TrafficLog.create(logData).catch((err) => {
      console.debug('Traffic log save error:', err.message);
    });
  } catch (err: any) {
    console.debug('Traffic log error:', err.message);
  }
  return next();
};
