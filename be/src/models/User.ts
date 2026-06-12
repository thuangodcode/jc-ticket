import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Interface - Defines the structure of User documents
 */
export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin' | 'event_admin' | 'staff';
  managedEventIds: Types.ObjectId[];
  isVerified: boolean;
verificationOTP?: string | undefined;
verificationOTPExpires?: Date | undefined;
resetPasswordOTP?: string | undefined;
resetPasswordExpires?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema - MongoDB schema for User collection
 * Includes: name, email, password (hashed), avatar, role, verification status, OTP fields
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'event_admin', 'staff'],
      default: 'user',
    },
    managedEventIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationOTP: {
      type: String,
      select: false,
    },
    verificationOTPExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware: Hash password before saving
 * Only hash if password is new or modified
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method: Compare provided password with hashed password
 * Used during login
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Create and export User model
 */
export const User = mongoose.model<IUser>('User', userSchema);
