import { Router } from 'express';
import { getChatHistory, getChatRooms } from '../controllers/chat.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Áp dụng middleware bảo vệ protect cho tất cả các routes chat
router.use(protect);

// GET /api/chat/history/:room - Lấy lịch sử chat
router.get('/history/:room', getChatHistory);

// GET /api/chat/rooms - Lấy danh sách các phòng chat đang hoạt động (Chỉ staff/admin)
router.get('/rooms', getChatRooms);

export default router;
