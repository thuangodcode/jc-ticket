import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ChatMessage } from '../models/ChatMessage';

/**
 * Khởi tạo hệ thống socket.io cho ứng dụng chat thời gian thực
 */
export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://jc-ticket.vercel.app',
        'https://jc-ticket-fe.vercel.app',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware xác thực token JWT khi kết nối socket
  io.use(async (socket: any, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Kiểm tra trong query parameters
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      // Kiểm tra trong Cookies (khi chạy cùng domain/credentials)
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        const accessTokenCookie = cookies.find((c: string) => c.trim().startsWith('accessToken='));
        if (accessTokenCookie) {
          token = accessTokenCookie.split('=')[1];
        }
      }

      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      // Tìm người dùng trong database
      const user = await User.findById(decoded.id).select('name role email avatar');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Đính kèm thông tin user vào socket instance
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
        avatar: user.avatar,
      };

      next();
    } catch (err) {
      console.error('Socket auth failed:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role}) [SocketID: ${socket.id}]`);

    // Lắng nghe sự kiện tham gia phòng chat
    socket.on('join_room', (room: string) => {
      const userId = socket.user.id;
      const role = socket.user.role;

      // Bảo mật: Người dùng thường chỉ được phép vào phòng chat có tên trùng với userId của mình
      if (role === 'user' && room !== userId) {
        socket.emit('error_message', 'Bạn không có quyền tham gia phòng chat này.');
        return;
      }

      socket.join(room);
      console.log(`🚪 User ${socket.user.name} (${role}) joined room: ${room}`);
    });

    // Lắng nghe sự kiện gửi tin nhắn
    socket.on('send_message', async (data: { room: string; content: string }) => {
      const { room, content } = data;
      const userId = socket.user.id;
      const role = socket.user.role;
      const name = socket.user.name;

      if (!room || !content || !content.trim()) return;

      // Bảo mật: Người dùng thường chỉ được gửi tin nhắn vào phòng chat của chính mình
      if (role === 'user' && room !== userId) {
        socket.emit('error_message', 'Bạn không có quyền gửi tin nhắn vào phòng chat này.');
        return;
      }

      try {
        // Lưu tin nhắn vào cơ sở dữ liệu
        const chatMsg = await ChatMessage.create({
          room,
          senderId: userId,
          senderName: name,
          senderRole: role,
          content: content.trim(),
        });

        // Gửi tin nhắn đến toàn bộ phòng chat (gồm cả người gửi và người nhận)
        io.to(room).emit('receive_message', chatMsg);

        // Phát sự kiện toàn cục để các nhân viên hỗ trợ (Staff) đang trực ở Dashboard biết để cập nhật danh sách
        if (role === 'user') {
          io.emit('new_user_message', {
            room,
            lastMessage: content.trim(),
            lastMessageSender: name,
            lastMessageRole: role,
            lastMessageAt: chatMsg.createdAt,
            user: {
              id: userId,
              name,
              email: socket.user.email,
              avatar: socket.user.avatar,
            },
          });
        }
      } catch (err) {
        console.error('Failed to handle send_message:', err);
        socket.emit('error_message', 'Không thể gửi tin nhắn.');
      }
    });

    // Lắng nghe sự kiện đang nhập văn bản (typing indicator)
    socket.on('typing', (data: { room: string; isTyping: boolean }) => {
      const { room, isTyping } = data;
      const name = socket.user.name;
      const role = socket.user.role;

      // Gửi trạng thái gõ phím cho những người khác trong phòng chat
      socket.to(room).emit('user_typing', {
        room,
        name,
        role,
        isTyping,
      });
    });

    // Khi ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};
