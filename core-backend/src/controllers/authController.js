const authService = require('../services/authService');

/**
 * Auth Controller
 * Handles authentication-related requests with proper session management
 */

// Register a new user
const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.register(email, password, name, role);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Login user with device-based session management
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { userAgent, ipAddress } = req;
    
    const result = await authService.login(email, password, userAgent, ipAddress);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Logout user (invalidate specific session)
const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.user?.sessionId;
    
    await authService.logout(userId, sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token with proper token rotation
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get current user sessions
const getSessions = async (req, res, next) => {
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

// Revoke specific session
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

// Logout from all devices
const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    await authService.logout(userId, null); // null means logout from all devices
    
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getSessions,
  revokeSession,
  logoutAll
};