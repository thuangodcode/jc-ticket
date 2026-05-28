import { Router } from 'express';
import { userChat, adminChat } from '../controllers/ai.controller';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * AI Routes
 *
 * POST /api/ai/user-chat  — User AI assistant (optional auth for personalized data)
 * POST /api/ai/admin-chat — Admin AI assistant (admin only)
 */

// User chat: optionally authenticated (protect runs only if token present)
router.post('/user-chat', (req, res, next) => {
  // Try to authenticate but don't block if no token
  const token = req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (token) {
    return protect(req as any, res, next);
  }
  return next();
}, userChat);

// Admin chat: requires admin authentication
router.post('/admin-chat', protect, adminOnly, adminChat);

export default router;
