import { Router } from 'express';
import { subscribeNewsletter } from '../controllers/newsletter.controller';

const router = Router();

// POST /api/newsletter/subscribe
router.post('/subscribe', subscribeNewsletter);

export default router;
