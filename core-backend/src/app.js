import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from './config/constants.js';
import ApiResponse from './utils/api-response.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import userRoutes from './routes/user.routes.js';
import issuerRoutes from './routes/issuer.routes.js';
import documentTypeRoutes from './routes/document-type.routes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import loggingMiddleware from './middleware/logging.middleware.js';
import { deviceInfo } from './middleware/auth.middleware.js';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Custom logging middleware
app.use(loggingMiddleware);

// Device information middleware
app.use(deviceInfo);

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: { code: 'RATE_LIMIT_EXCEEDED' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', limiter);
}

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: { code: 'AUTH_RATE_LIMIT_EXCEEDED' }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  ApiResponse.success(res, {
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API routes
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}
app.use('/api/documents', documentRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issuers', issuerRoutes);
app.use('/api/document-types', documentTypeRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

export default app;