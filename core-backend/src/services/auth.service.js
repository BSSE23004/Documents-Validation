import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { ERROR_CODES, USER_ROLES } from '../config/constants.js';
import {
  generateJWTToken,
  verifyJWTToken,
  generateRefreshToken,
  generateDeviceId,
  calculateSessionExpiration
} from '../config/jwt.js';

/**
 * Auth Service (ESM)
 * Handles authentication business logic with proper JWT and session management
 */

// Register a new user
export const register = async (email, password, name, role = USER_ROLES.USER) => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Invalid email format');
    error.code = ERROR_CODES.VALIDATION_INVALID_INPUT;
    throw error;
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    const error = new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    error.code = ERROR_CODES.VALIDATION_INVALID_INPUT;
    throw error;
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = ERROR_CODES.VALIDATION_DUPLICATE_EMAIL;
    throw error;
  }

  // Hash password with bcrypt
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  // Generate JWT token
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  const token = generateJWTToken(tokenPayload);

  return {
    user,
    token
  };
};

// Login user with device-based session management
export const login = async (email, password, userAgent, ipAddress) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.code = ERROR_CODES.AUTH_INVALID_CREDENTIALS;
    throw error;
  }

  // Check if user is active
  if (!user.isActive) {
    const error = new Error('User account is inactive');
    error.code = ERROR_CODES.AUTH_USER_INACTIVE;
    throw error;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    const error = new Error('Invalid email or password');
    error.code = ERROR_CODES.AUTH_INVALID_CREDENTIALS;
    throw error;
  }

  // Generate device ID from user agent
  const deviceId = generateDeviceId(userAgent);

  // Check for existing session on this device
  const existingSession = await prisma.session.findFirst({
    where: {
      userId: user.id,
      deviceId
    }
  });

  // Delete existing session if found (one session per device)
  if (existingSession) {
    await prisma.session.delete({
      where: { id: existingSession.id }
    });
  }

  // Check maximum sessions per user
  const sessionCount = await prisma.session.count({
    where: { userId: user.id }
  });

  const maxSessions = parseInt(process.env.MAX_SESSIONS_PER_USER) || 5;
  
  if (sessionCount >= maxSessions) {
    // Delete oldest session
    const oldestSession = await prisma.session.findFirst({
      where: { userId: user.id },
      orderBy: { lastActiveAt: 'asc' }
    });
    
    if (oldestSession) {
      await prisma.session.delete({
        where: { id: oldestSession.id }
      });
    }
  }

  // Generate JWT token payload
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: null // Will be replaced with actual session ID
  };

  // Generate JWT token
  const token = generateJWTToken(tokenPayload);

  // Generate refresh token
  const refreshToken = generateRefreshToken();

  // Calculate expiration date
  const expiresAt = calculateSessionExpiration();

  // Create session in database
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      deviceId,
      token,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt
    }
  });

  // Update token payload with actual session ID
  const updatedTokenPayload = {
    ...tokenPayload,
    sessionId: session.id
  };
  const updatedToken = generateJWTToken(updatedTokenPayload);

  // Update session with new token containing session ID
  await prisma.session.update({
    where: { id: session.id },
    data: { token: updatedToken }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token: updatedToken,
    refreshToken,
    sessionId: session.id,
    expiresAt: session.expiresAt
  };
};

// Logout user (invalidate specific session)
export const logout = async (userId, sessionId) => {
  if (sessionId) {
    // Delete specific session
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (session && session.userId === userId) {
      await prisma.session.delete({
        where: { id: sessionId }
      });
    }
  } else {
    // Delete all sessions for user (logout from all devices)
    await prisma.session.deleteMany({
      where: { userId }
    });
  }
};

// Refresh token (implementing proper token rotation)
export const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.code = ERROR_CODES.AUTH_TOKEN_MISSING;
    throw error;
  }

  // Find session by refresh token
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  });

  if (!session) {
    const error = new Error('Invalid refresh token');
    error.code = ERROR_CODES.AUTH_TOKEN_INVALID;
    throw error;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: { id: session.id }
    });
    
    const error = new Error('Refresh token expired');
    error.code = ERROR_CODES.AUTH_TOKEN_EXPIRED;
    throw error;
  }

  // Check if user is still active
  if (!session.user.isActive) {
    const error = new Error('User account is inactive');
    error.code = ERROR_CODES.AUTH_USER_INACTIVE;
    throw error;
  }

  // Generate new JWT token
  const tokenPayload = {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
    sessionId: session.id
  };
  const newToken = generateJWTToken(tokenPayload);

  // Generate new refresh token (token rotation)
  const newRefreshToken = generateRefreshToken();

  // Update session with new tokens
  const newExpiresAt = calculateSessionExpiration();

  await prisma.session.update({
    where: { id: session.id },
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      lastActiveAt: new Date()
    }
  });

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt
  };
};

// Validate session (used by middleware)
export const validateSession = async (token) => {
  try {
    // Verify JWT token
    const decoded = verifyJWTToken(token);

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      const error = new Error('Session not found');
      error.code = ERROR_CODES.AUTH_TOKEN_INVALID;
      throw error;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: { id: session.id }
      });
      
      const error = new Error('Session expired');
      error.code = ERROR_CODES.AUTH_TOKEN_EXPIRED;
      throw error;
    }

    // Check if user is still active
    if (!session.user.isActive) {
      const error = new Error('User account is inactive');
      error.code = ERROR_CODES.AUTH_USER_INACTIVE;
      throw error;
    }

    // Update last active timestamp
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    });

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      sessionId: session.id
    };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    
    const authError = new Error('Authentication failed');
    authError.code = ERROR_CODES.AUTH_TOKEN_INVALID;
    throw authError;
  }
};

// Get all sessions for a user
export const getUserSessions = async (userId) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      deviceId: true,
      userAgent: true,
      ipAddress: true,
      lastActiveAt: true,
      expiresAt: true,
      createdAt: true
    },
    orderBy: { lastActiveAt: 'desc' }
  });

  return sessions;
};

// Revoke specific session
export const revokeSession = async (userId, sessionId) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    const error = new Error('Session not found');
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  if (session.userId !== userId) {
    const error = new Error('Insufficient permissions');
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  await prisma.session.delete({
    where: { id: sessionId }
  });
};

export {
  verifyJWTToken,
  generateJWTToken
};

export default {
  register,
  login,
  logout,
  refreshToken,
  validateSession,
  getUserSessions,
  revokeSession,
  verifyJWTToken,
  generateJWTToken
};
