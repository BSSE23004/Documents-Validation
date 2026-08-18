const authService = require('../services/authService');

/**
 * Auth Controller
 * Handles authentication-related requests
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

// Login user
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

// Logout user
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

// Refresh token
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

module.exports = {
  register,
  login,
  logout,
  refreshToken
};