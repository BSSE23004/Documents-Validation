import authService from '../services/auth.service.js';
import ApiResponse from '../utils/api-response.js';

/**
 * Auth Controller
 * Handles authentication-related requests with proper session management
 */

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.register(email, password, name, role);
    
    return ApiResponse.created(res, {
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Login user with device-based session management
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { userAgent, ipAddress } = req;
    
    const result = await authService.login(email, password, userAgent, ipAddress);
    
    return ApiResponse.success(res, {
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Logout user (invalidate specific session)
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.user?.sessionId;
    
    await authService.logout(userId, sessionId);
    
    return ApiResponse.success(res, {
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token with proper token rotation
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    
    return ApiResponse.success(res, {
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get current user sessions
export const getSessions = async (req, res, next) => {
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

// Revoke specific session
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

// Logout from all devices
export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    await authService.logout(userId, null);
    
    return ApiResponse.success(res, {
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
  getSessions,
  revokeSession,
  logoutAll
};