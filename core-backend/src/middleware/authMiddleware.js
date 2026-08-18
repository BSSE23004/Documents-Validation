const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user information to request
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

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      });
    }

    if (!session.user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }

    // Attach user information to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      sessionId: session.id
    };

    // Update last active timestamp
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid authentication token'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      });
    }

    next(error);
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

module.exports = {
  authenticate,
  authorize,
  deviceInfo
};