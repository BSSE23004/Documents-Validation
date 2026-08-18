const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { ERROR_CODES } = require('../config/constants');

const prisma = new PrismaClient();

/**
 * Auth Service
 * Handles authentication business logic
 */

// Register a new user
const register = async (email, password, name, role = 'user') => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = ERROR_CODES.VALIDATION_DUPLICATE_EMAIL;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

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
      createdAt: true
    }
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user,
    token
  };
};

// Login user
const login = async (email, password, userAgent, ipAddress) => {
  // Find user
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

  // Generate device ID
  const deviceId = userAgent ? userAgent.substring(0, 100) : uuidv4();

  // Check for existing session on this device
  const existingSession = await prisma.session.findFirst({
    where: {
      userId: user.id,
      deviceId
    }
  });

  if (existingSession) {
    // Delete existing session
    await prisma.session.delete({
      where: { id: existingSession.id }
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (parseInt(process.env.SESSION_DURATION_DAYS) || 7));

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      deviceId,
      token,
      userAgent,
      ipAddress,
      expiresAt
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token,
    sessionId: session.id,
    expiresAt: session.expiresAt
  };
};

// Logout user
const logout = async (userId, sessionId) => {
  if (sessionId) {
    await prisma.session.delete({
      where: { id: sessionId }
    });
  } else {
    // Delete all sessions for user
    await prisma.session.deleteMany({
      where: { userId }
    });
  }
};

// Refresh token
const refreshToken = async (refreshToken) => {
  // This is a placeholder - implement refresh token logic
  const error = new Error('Refresh token functionality not yet implemented');
  error.code = ERROR_CODES.INTERNAL_ERROR;
  throw error;
};

module.exports = {
  register,
  login,
  logout,
  refreshToken
};