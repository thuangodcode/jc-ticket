import './config/loadEnv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Routes
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import bookingRoutes from './routes/booking.routes';
import ticketRoutes from './routes/ticket.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload';
import { globalErrorHandler } from './middleware/auth';
import { Booking } from './models/Booking';
import { Event } from './models/Event';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

// CORS Middleware - Allow credentials and specific origins
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser Middleware - For reading/setting httpOnly cookies
app.use(cookieParser());

// Kiểm tra MONGO_URI trước khi kết nối
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file');
  process.exit(1);
}

// Kết nối MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Thoát nếu không kết nối được DB
  });

// Routes
app.get('/', (_req, res) => {
  res.json({ 
    message: 'JC-Ticket Backend đang chạy!',
    status: 'success',
    database: 'Connected to MongoDB Atlas',
    version: '2.0.0'
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', uploadRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Global Error Handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API Routes: /api/auth, /api/events, /api/bookings, /api/tickets, /api/payment`);
  // Background job: cancel expired pending bookings and release seats
  const cancelExpiredBookings = async () => {
    try {
      const now = new Date();
      const expired = await Booking.find({ status: 'pending', expiresAt: { $lt: now } });
      if (!expired.length) return;

      for (const b of expired) {
        if (b.paymentStatus === 'successful') continue; // never cancel successful

        const session = await (await import('mongoose')).startSession();
        session.startTransaction();
        try {
          const fresh = await Booking.findById(b._id).session(session);
          if (!fresh) {
            await session.abortTransaction();
            session.endSession();
            continue;
          }

          const event = await Event.findById(fresh.eventId).session(session);
          if (event) {
            const seatsToRelease = Array.isArray(fresh.selectedSeats) ? fresh.selectedSeats : [];
            event.seatMap.reservedSeats = event.seatMap.reservedSeats.filter(
              (s: string) => !seatsToRelease.includes(s)
            );
            event.availableSeats = Math.min(event.totalSeats, event.availableSeats + seatsToRelease.length);
            await event.save({ session });
          }

          // Update booking without running full document validation to avoid errors
          // if some historical bookings have missing fields. Use updateOne with session.
          await Booking.updateOne(
            { _id: fresh._id },
            {
              $set: {
                status: 'cancelled',
                paymentStatus: fresh.paymentStatus === 'successful' ? 'successful' : 'failed',
                cancelledAt: new Date(),
              },
            },
            { session }
          );

          await session.commitTransaction();
          session.endSession();
          console.log(`🗑️ Auto-cancelled expired booking ${fresh.bookingCode}`);
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          console.error('Error auto-cancelling booking:', err);
        }
      }
    } catch (err) {
      console.error('Error in cancelExpiredBookings job:', err);
    }
  };

  // Run every minute
  setInterval(cancelExpiredBookings, 60 * 1000);
});