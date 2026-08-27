import { prisma } from '../config/database.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * User Service (ESM)
 * Handles user management business logic
 */

// Get user profile
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  return { user };
};

// Update user profile
export const updateUserProfile = async (userId, updateData) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    const error = new Error('User not found');
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // Only allow updating specific fields
  const allowedUpdates = ['name'];
  const filteredData = {};
  
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: filteredData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { user: updatedUser };
};

// Get user sessions
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

  return { sessions };
};

export default {
  getUserProfile,
  updateUserProfile,
  getUserSessions
};
