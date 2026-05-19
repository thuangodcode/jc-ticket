import mongoose, { Schema, Document } from 'mongoose';

/**
 * Ticket Interface - Vé điện tử
 * Mỗi ghế = 1 ticket riêng biệt
 */
export interface ITicket extends Document {
  ticketCode: string;           // Mã vé unique: VE + YYMMDD + 4 digit
  bookingId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  seatNumber: string;           // Ví dụ: "A1", "B5"
  ticketType: 'standard' | 'vip';
  price: number;
  qrCodeData: string;           // JSON string chứa thông tin verify
  status: 'active' | 'used' | 'cancelled' | 'expired';
  usedAt?: Date;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ticket Schema
 */
const ticketSchema = new Schema<ITicket>(
  {
    ticketCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    passengerName: {
      type: String,
      required: true,
      trim: true,
    },
    passengerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passengerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    ticketType: {
      type: String,
      enum: ['standard', 'vip'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    qrCodeData: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'used', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    usedAt: Date,
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ userId: 1, issuedAt: -1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
