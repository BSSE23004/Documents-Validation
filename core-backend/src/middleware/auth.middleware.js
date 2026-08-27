import authService from '../services/auth.service.js';
import ApiResponse from '../utils/api-response.js';

/**
 * Authentication Middleware (ESM)
 * Verifies JWT tokens and attaches user information to request
 * Implements proper session management with device-based authentication
 */

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, {
        message: 'Authentication token is missing',
        data: {
          code: 'AUTH_TOKEN_MISSING'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use authService to validate session (includes database check)
    const { user, sessionId } = await authService.validateSession(token);

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId: sessionId
    };

    next();
  } catch (error) {
    if (error.code) {
      return ApiResponse.unauthorized(res, {
        message: error.message,
        data: {
          code: error.code
        }
      });
    }
    
    return ApiResponse.unauthorized(res, {
      message: 'Invalid authentication token',
      data: {
        code: 'AUTH_TOKEN_INVALID'
      }
    });
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, {
        message: 'Authentication required',
        data: {
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, {
        message: 'Insufficient permissions to access this resource',
        data: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  };
};

/**
 * Device Information Middleware
 * Extracts and attaches device information to request
 */
export const deviceInfo = (req, res, next) => {
  req.userAgent = req.headers['user-agent'] || null;
  req.ipAddress = req.ip || req.connection.remoteAddress || null;
  next();
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const { user, sessionId } = await authService.validateSession(token);
        
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionId: sessionId
        };
      } catch (error) {
        // If token is invalid, just continue without user info
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // If any error occurs, continue without user info
    req.user = null;
    next();
  }
};

export default {
  authenticate,
  authorize,
  deviceInfo,
  optionalAuth
};
