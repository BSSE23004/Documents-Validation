const userService = require('../services/userService');
const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * User Controller
 * Handles user management requests
 */

// Get current user profile
const getCurrentUserProfile = async (req, res, next) => {
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
const updateUserProfile = async (req, res, next) => {
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
const getUserSessions = async (req, res, next) => {
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

module.exports = {
  getCurrentUserProfile,
  updateUserProfile,
  getUserSessions
};