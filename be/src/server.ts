import './config/loadEnv';
import dns from 'dns';

// Force Node to use Google DNS to bypass local SRV lookup ECONNREFUSED issues on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.debug('Failed to set custom DNS servers:', e);
}

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
import http from 'http';
import aiRoutes from './routes/ai.routes';
import newsletterRoutes from './routes/newsletter.routes';
import chatRoutes from './routes/chat.routes';
import { initSocket } from './utils/socket';
import { globalErrorHandler } from './middleware/auth';
import { Booking } from './models/Booking';
import { Event } from './models/Event';
import { Ticket } from './models/Ticket';

const app = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Render.com and other reverse proxies
// Needed for: correct IP in rate limiting, secure cookies over HTTPS
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// CORS Middleware - Allow credentials and specific origins
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://jc-ticket.vercel.app',
  'https://jc-ticket-fe.vercel.app',
]);

const isAllowedOrigin = (origin: string) => {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Allow all Vercel preview deployments (*.vercel.app)
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }
    return url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || isAllowedOrigin(origin)) {
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

// Migrate existing tickets with localhost QR codes
const migrateQRCodes = async () => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://jc-ticket.vercel.app';
    const tickets = await Ticket.find({ qrCodeData: { $regex: 'localhost:5173' } });
    if (tickets.length > 0) {
      console.log(`🔍 Found ${tickets.length} tickets with localhost QR codes. Migrating...`);
      let updatedCount = 0;
      for (const ticket of tickets) {
        if (ticket.qrCodeData.includes('localhost:5173')) {
          ticket.qrCodeData = ticket.qrCodeData.replace(/https?:\/\/localhost:5173/g, frontendUrl);
          await ticket.save();
          updatedCount++;
        }
      }
      console.log(`✅ Successfully updated ${updatedCount} tickets' QR code data to point to: ${frontendUrl}`);
    }
  } catch (err) {
    console.error('❌ Failed to migrate QR codes:', err);
  }
};

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
    migrateQRCodes();
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
app.use('/api/ai', aiRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/chat', chatRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Global Error Handler
app.use(globalErrorHandler);

server.listen(PORT, () => {
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