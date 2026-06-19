import mongoose, { Schema, Document } from 'mongoose';

export interface ITrafficLog extends Document {
  ip?: string;
  userAgent?: string;
  path: string;
  method: string;
  userId?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const trafficLogSchema = new Schema<ITrafficLog>(
  {
    ip: String,
    userAgent: String,
    path: { type: String, required: true },
    method: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

trafficLogSchema.index({ timestamp: 1 });

export const TrafficLog = mongoose.model<ITrafficLog>('TrafficLog', trafficLogSchema);
