import userService from '../services/user.service.js';
import authService from '../services/auth.service.js';
import ApiResponse from '../utils/api-response.js';

/**
 * User Controller (ESM)
 * Handles user management requests
 */

// Get current user profile
export const getCurrentUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    const result = await userService.getUserProfile(userId);
    
    return ApiResponse.success(res, {
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const updateData = req.body;
    
    const result = await userService.updateUserProfile(userId, updateData);
    
    return ApiResponse.success(res, {
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get user sessions (using authService for proper session management)
export const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    const sessions = await authService.getUserSessions(userId);
    
    return ApiResponse.success(res, {
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

// Revoke a specific session
export const revokeSession = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    await authService.revokeSession(userId, sessionId);

    return ApiResponse.success(res, {
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCurrentUserProfile,
  updateUserProfile,
  getUserSessions,
  revokeSession
};
