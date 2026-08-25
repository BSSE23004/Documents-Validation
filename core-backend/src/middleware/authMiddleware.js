const { PrismaClient } = require('@prisma/client');
const authService = require('../services/authService');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user information to request
 * Implements proper session management with device-based authentication
 */

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication token is missing'
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
      return res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token'
      }
    });
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource'
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

const deviceInfo = (req, res, next) => {
  req.userAgent = req.headers['user-agent'] || null;
  req.ipAddress = req.ip || req.connection.remoteAddress || null;
  next();
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't require it
 */

const optionalAuth = async (req, res, next) => {
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

module.exports = {
  authenticate,
  authorize,
  deviceInfo,
  optionalAuth
};