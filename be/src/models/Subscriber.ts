import mongoose, { Schema, Document } from 'mongoose';

/**
 * Subscriber Interface - Cấu trúc document Subscriber đăng ký nhận tin
 */
export interface ISubscriber extends Document {
  email: string;
  subscribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscriber Schema - MongoDB schema cho collection subscribers
 */
const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
