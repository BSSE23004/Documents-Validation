const userService = require('../services/userService');

/**
 * User Controller
 * Handles user management requests
 */

// Get current user profile
const getCurrentUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    const result = await userService.getUserProfile(userId);
    
    res.status(200).json({
      success: true,
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
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get user sessions
const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    const result = await userService.getUserSessions(userId);
    
    res.status(200).json({
      success: true,
      data: result
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