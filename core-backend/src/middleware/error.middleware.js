import winston from 'winston';
import ApiResponse from '../utils/api-response.js';

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
 * Error Handling Middleware (ESM)
 * Centralized error handling for the application
 */

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  // Prisma errors
  if (err.code === 'P2002') {
    return ApiResponse.conflict(res, {
      message: 'A record with this value already exists',
      data: {
        code: 'VALIDATION_DUPLICATE',
        details: {
          field: err.meta?.target?.[0] || 'unknown',
          value: err.meta?.target?.[1] || 'unknown'
        }
      }
    });
  }

  if (err.code === 'P2025') {
    return ApiResponse.notFound(res, {
      message: 'Record not found',
      data: {
        code: 'NOT_FOUND'
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, {
      message: 'Invalid authentication token',
      data: {
        code: 'AUTH_TOKEN_INVALID'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, {
      message: 'Authentication token has expired',
      data: {
        code: 'AUTH_TOKEN_EXPIRED'
      }
    });
  }

  // Custom application errors
  if (err.code) {
    // Map error codes to HTTP status codes
    const statusCodeMap = {
      'AUTH_INVALID_CREDENTIALS': 401,
      'AUTH_TOKEN_INVALID': 401,
      'AUTH_TOKEN_EXPIRED': 401,
      'AUTH_INSUFFICIENT_PERMISSIONS': 403,
      'VALIDATION_INVALID_INPUT': 422,
      'VALIDATION_DUPLICATE': 409,
      'VALIDATION_DUPLICATE_EMAIL': 409,
      'NOT_FOUND': 404,
      'DOCUMENT_NOT_FOUND': 404,
      'DOCUMENT_QR_NOT_FOUND': 404,
      'DOCUMENT_EXPIRED': 400,
      'DOCUMENT_REVOKED': 400,
      'RATE_LIMIT_EXCEEDED': 429,
      'DATABASE_ERROR': 500
    };

    const statusCode = statusCodeMap[err.code] || 500;
    const errorData = { code: err.code };
    if (err.details !== undefined) {
      errorData.details = err.details;
    }
    return ApiResponse.error(res, {
      statusCode,
      message: err.message || 'An error occurred',
      data: errorData
    });
  }

  // Generic error response
  return ApiResponse.internalError(res, {
    message: 'Internal server error',
    data: {
      code: 'INTERNAL_ERROR'
    }
  });
};

/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(res, {
    message: 'Route not found',
    data: {
      code: 'NOT_FOUND'
    }
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
