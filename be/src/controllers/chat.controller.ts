import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ChatMessage } from '../models/ChatMessage';
import { User } from '../models/User';

/**
 * @desc    Lấy lịch sử tin nhắn của một phòng chat
 * @route   GET /api/chat/history/:room
 * @access  Private
 */
export const getChatHistory = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { room } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Bảo mật: Nếu là user thường, chỉ được phép xem phòng chat của chính mình (room = userId)
    if (userRole === 'user' && room !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch sử phòng chat này.',
      });
      return;
    }

    const messages = await ChatMessage.find({ room })
      .sort({ createdAt: 1 })
      .limit(100); // Giới hạn 100 tin nhắn gần nhất

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách các phòng chat đang hoạt động (Chỉ cho Admin/Staff)
 * @route   GET /api/chat/rooms
 * @access  Private (Admin/Staff only)
 */
export const getChatRooms = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'staff') {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện chức năng này.',
      });
      return;
    }

    // Thực hiện aggregation để tìm tất cả các phòng chat khác nhau,
    // kèm theo tin nhắn cuối cùng của mỗi phòng, sắp xếp theo thời gian gửi giảm dần.
    const activeRooms = await ChatMessage.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$content' },
          lastMessageSender: { $first: '$senderName' },
          lastMessageRole: { $first: '$senderRole' },
          lastMessageAt: { $first: '$createdAt' },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
    ]);

    // Lấy thông tin chi tiết của người dùng cho từng phòng (room = userId)
    const formattedRooms = await Promise.all(
      activeRooms.map(async (roomData) => {
        const roomId = roomData._id;

        // Thử tìm người dùng dựa trên roomId (vốn là userId)
        let userInfo = null;
        if (mongoose.Types.ObjectId.isValid(roomId)) {
          const user = await User.findById(roomId).select('name email avatar phone role');
          if (user) {
            userInfo = {
              id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              phone: user.phone,
              role: user.role,
            };
          }
        }

        return {
          room: roomId,
          lastMessage: roomData.lastMessage,
          lastMessageSender: roomData.lastMessageSender,
          lastMessageRole: roomData.lastMessageRole,
          lastMessageAt: roomData.lastMessageAt,
          user: userInfo || {
            name: `Khách hàng (${roomId.slice(-6)})`,
            email: 'N/A',
            avatar: null,
          },
        };
      })
    );

    res.json({
      success: true,
      data: formattedRooms,
    });
  } catch (error) {
    next(error);
  }
};
