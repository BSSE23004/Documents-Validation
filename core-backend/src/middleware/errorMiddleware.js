const winston = require('winston');

// Winston logger configuration
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  // Default error
  let error = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  // Prisma errors
  if (err.code === 'P2002') {
    error = {
      success: false,
      error: {
        code: 'VALIDATION_DUPLICATE',
        message: 'A record with this value already exists',
        details: {
          field: err.meta?.target?.[0] || 'unknown',
          value: err.meta?.target?.[1] || 'unknown'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(409).json(error);
  }

  if (err.code === 'P2025') {
    error = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Record not found',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(404).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      error: {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    return res.status(401).json(error);
  }

  // Custom application errors
  if (err.code) {
    error = {
      success: false,
      error: {
        code: err.code,
        message: err.message || 'An error occurred',
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };
    
    // Map error codes to HTTP status codes
    const statusCodeMap = {
      'AUTH_INVALID_CREDENTIALS': 401,
      'AUTH_TOKEN_EXPIRED': 401,
      'AUTH_INSUFFICIENT_PERMISSIONS': 403,
      'VALIDATION_INVALID_INPUT': 422,
      'VALIDATION_DUPLICATE_EMAIL': 409,
      'DOCUMENT_NOT_FOUND': 404,
      'DOCUMENT_QR_NOT_FOUND': 404,
      'DOCUMENT_EXPIRED': 400,
      'DOCUMENT_REVOKED': 400,
      'RATE_LIMIT_EXCEEDED': 429,
      'DATABASE_ERROR': 500
    };

    const statusCode = statusCodeMap[err.code] || 500;
    return res.status(statusCode).json(error);
  }

  // Generic error response
  res.status(500).json(error);
};

/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.path,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};