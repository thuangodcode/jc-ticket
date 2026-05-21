import mongoose, { Schema, Document } from 'mongoose';

/**
 * Event Interface - Cấu trúc document Event
 */
export interface IEvent extends Document {
  title: string;
  description: string;
  category: string;
  image: string;
  imagePublicId?: string;
  date: Date;
  endDate?: Date;
  location: string;
  venue: string;
  price: number;           // Giá vé cơ bản (VND)
  vipPrice?: number;       // Giá vé VIP
  totalSeats: number;
  availableSeats: number;
  seatMap: ISeatMap;       // Seat map configuration
  organizer: string;
  status: 'active' | 'cancelled' | 'completed' | 'draft';
  tags: string[];
  rating: number;
  attendees: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seat Map Interface - Cấu hình sơ đồ ghế
 */
export interface ISeatMap {
  rows: number;            // Số hàng (A, B, C...)
  seatsPerRow: number;     // Số ghế mỗi hàng
  vipRows: number[];       // Index các hàng VIP (0-based)
  reservedSeats: string[]; // Danh sách ghế đã đặt: ["A1", "A2", "B5"]
}

const seatMapSchema = new Schema<ISeatMap>({
  rows: { type: Number, default: 10 },
  seatsPerRow: { type: Number, default: 12 },
  vipRows: { type: [Number], default: [0, 1] },  // 2 hàng đầu là VIP
  reservedSeats: { type: [String], default: [] },
}, { _id: false });

/**
 * Event Schema - MongoDB schema cho collection events
 */
const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['anime', 'traditional', 'food', 'music', 'travel', 'seasonal', 'cinema', 'sports', 'other'],
    },
    image: {
      type: String,
      required: [true, 'Event image is required'],
    },
    imagePublicId: {
      type: String,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    endDate: {
      type: Date,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    vipPrice: {
      type: Number,
      min: [0, 'VIP price cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Must have at least 1 seat'],
    },
    availableSeats: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
    },
    seatMap: {
      type: seatMapSchema,
      default: () => ({ rows: 10, seatsPerRow: 12, vipRows: [0, 1], reservedSeats: [] }),
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed', 'draft'],
      default: 'active',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    attendees: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ title: 'text', description: 'text' });

/**
 * Virtual: kiểm tra sự kiện đã hết vé
 */
eventSchema.virtual('isSoldOut').get(function () {
  return this.availableSeats <= 0;
});

/**
 * Virtual: kiểm tra sự kiện sắp diễn ra
 */
eventSchema.virtual('isUpcoming').get(function () {
  return this.date > new Date() && this.status === 'active';
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);
