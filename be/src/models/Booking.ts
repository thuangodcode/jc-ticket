import mongoose, { Schema, Document } from 'mongoose';

/**
 * Booking Interface - Cấu trúc document Booking (đơn đặt vé)
 */
export interface IBooking extends Document {
  bookingCode: string;
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  tickets: IBookingTicket[];
  selectedSeats: string[];      // Ghế đã chọn: ["A1", "A2", "B3"]
  totalPrice: number;
  passengerInfo: IPassengerInfo;
  paymentMethod?: 'payos';
  paymentStatus: 'pending' | 'successful' | 'failed' | 'refunded';
  paymentId?: string;           // Transaction ID từ payment gateway
  payosOrderCode?: number;      // Unique order code for PayOS (64-bit int)
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmedAt?: Date;
  cancelledAt?: Date;
  expiresAt: Date;              // Booking hết hạn nếu chưa thanh toán
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking Ticket Item - Mỗi loại vé trong booking
 */
export interface IBookingTicket {
  ticketType: 'standard' | 'vip';
  quantity: number;
  unitPrice: number;
}

/**
 * Passenger Info - Thông tin hành khách
 */
export interface IPassengerInfo {
  name: string;
  email: string;
  phone: string;
}

const bookingTicketSchema = new Schema<IBookingTicket>({
  ticketType: {
    type: String,
    enum: ['standard', 'vip'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const passengerInfoSchema = new Schema<IPassengerInfo>({
  name: {
    type: String,
    required: [true, 'Passenger name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Passenger email is required'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Passenger phone is required'],
    trim: true,
  },
}, { _id: false });

/**
 * Booking Schema
 */
const bookingSchema = new Schema<IBooking>(
  {
    bookingCode: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    tickets: {
      type: [bookingTicketSchema],
      required: true,
      validate: [(v: any[]) => v.length > 0, 'At least one ticket type required'],
    },
    selectedSeats: {
      type: [String],
      default: [],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    passengerInfo: {
      type: passengerInfoSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['payos'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentId: {
      type: String,
    },
    payosOrderCode: {
      type: Number,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    confirmedAt: Date,
    cancelledAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 phút
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1, status: 1 });

/**
 * Pre-save: Tự động tạo bookingCode nếu chưa có
 * Format: BK + YYMMDD + 6 ký tự random
 */
bookingSchema.pre('save', function () {
  if (!this.bookingCode) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingCode = `BK${yy}${mm}${dd}${rand}`;
  }
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
