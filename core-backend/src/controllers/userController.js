const userService = require('../services/userService');
const authService = require('../services/authService');

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

// Get user sessions (using authService for proper session management)
const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    const sessions = await authService.getUserSessions(userId);
    
    res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

// Revoke a specific session
const revokeSession = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    await authService.revokeSession(userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUserProfile,
  updateUserProfile,
  getUserSessions,
  revokeSession
};