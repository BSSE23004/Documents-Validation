const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { ERROR_CODES, USER_ROLES } = require('../config/constants');

const prisma = new PrismaClient();

/**
 * Auth Service
 * Handles authentication business logic with proper JWT and session management
 */

// Helper function to generate device ID from user agent
const generateDeviceId = (userAgent) => {
  if (!userAgent) return uuidv4();
  
  // Create a hash of the user agent for consistent device identification
  const hash = crypto.createHash('sha256').update(userAgent).digest('hex');
  return hash.substring(0, 64); // Use first 64 characters
};

// Helper function to generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Helper function to generate JWT token
const generateJWTToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper function to verify JWT token
const verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

// Register a new user
const register = async (email, password, name, role = USER_ROLES.USER) => {
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
const login = async (email, password, userAgent, ipAddress) => {
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
    sessionId: uuidv4() // Will be replaced with actual session ID
  };

  // Generate JWT token
  const token = generateJWTToken(tokenPayload);

  // Generate refresh token
  const refreshToken = generateRefreshToken();

  // Calculate expiration date
  const sessionDurationDays = parseInt(process.env.SESSION_DURATION_DAYS) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + sessionDurationDays);

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
const logout = async (userId, sessionId) => {
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
const refreshToken = async (refreshToken) => {
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
  const sessionDurationDays = parseInt(process.env.SESSION_DURATION_DAYS) || 7;
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + sessionDurationDays);

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
const validateSession = async (token) => {
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
const getUserSessions = async (userId) => {
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
const revokeSession = async (userId, sessionId) => {
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

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  validateSession,
  getUserSessions,
  revokeSession
};