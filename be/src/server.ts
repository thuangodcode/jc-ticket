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
});