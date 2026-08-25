const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_CONFIG } = require('./config/constants');

// Import routes
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const userRoutes = require('./routes/userRoutes');
const issuerRoutes = require('./routes/issuerRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const { deviceInfo } = require('./middleware/authMiddleware');

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
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
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
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
if(process.env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter, authRoutes);
}
else{
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

module.exports = app;