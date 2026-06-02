import mongoose, { Schema, Document } from 'mongoose';

/**
 * ChatMessage Interface - Cấu trúc document ChatMessage
 */
export interface IChatMessage extends Document {
  room: string;                  // Tên phòng chat (thường là User ID của khách hàng)
  senderId: mongoose.Types.ObjectId; // ID người gửi (User hoặc Staff)
  senderName: string;            // Tên người gửi
  senderRole: 'user' | 'admin' | 'staff'; // Vai trò người gửi
  content: string;               // Nội dung tin nhắn
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ChatMessage Schema - MongoDB Schema cho ChatMessage
 */
const chatMessageSchema = new Schema<IChatMessage>(
  {
    room: {
      type: String,
      required: [true, 'Room identifier is required'],
      index: true, // Đánh chỉ mục để truy vấn lịch sử nhanh
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'staff'],
      required: [true, 'Sender role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
  },
  {
    timestamps: true, // Tự động quản lý createdAt, updatedAt
  }
);

// Sắp xếp mặc định theo thời gian gửi tin nhắn tăng dần
chatMessageSchema.index({ room: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
