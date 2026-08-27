import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * JWT Configuration Module
 * Handles JWT token generation, verification, and related security functions
 */

/**
 * Generate JWT token with specified payload
 * @param {Object} payload - Token payload (userId, email, role, sessionId)
 * @returns {String} JWT token
 */
export const generateJWTToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT token and return decoded payload
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Token expired');
      expiredError.code = 'AUTH_TOKEN_EXPIRED';
      expiredError.originalError = error;
      throw expiredError;
    }
    
    const invalidError = new Error('Invalid token');
    invalidError.code = 'AUTH_TOKEN_INVALID';
    invalidError.originalError = error;
    throw invalidError;
  }
};

/**
 * Generate cryptographically secure refresh token
 * @returns {String} Refresh token (80 character hex string)
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Generate device ID from user agent string
 * Uses SHA-256 hash for consistent device identification
 * @param {String} userAgent - User agent string
 * @returns {String} Device ID (64 character hash)
 */
export const generateDeviceId = (userAgent) => {
  if (!userAgent) return uuidv4();
  
  // Create a hash of the user agent for consistent device identification
  const hash = crypto.createHash('sha256').update(userAgent).digest('hex');
  return hash.substring(0, 64); // Use first 64 characters
};

/**
 * Calculate session expiration date
 * @param {Number} days - Number of days until expiration (default: 7)
 * @returns {Date} Expiration date
 */
export const calculateSessionExpiration = (days = null) => {
  const sessionDurationDays = days || parseInt(process.env.SESSION_DURATION_DAYS) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + sessionDurationDays);
  return expiresAt;
};

/**
 * Decode JWT token without verification (for debugging/testing)
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export const decodeJWTToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    const decodeError = new Error('Failed to decode token');
    decodeError.code = 'AUTH_TOKEN_DECODE_ERROR';
    throw decodeError;
  }
};

/**
 * Get token expiration time from JWT
 * @param {String} token - JWT token
 * @returns {Date|null} Expiration date or null if not found
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = decodeJWTToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {String} token - JWT token to check
 * @returns {Boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
};

/**
 * Validate JWT token structure without verification
 * @param {String} token - Token to validate
 * @returns {Boolean} True if token has valid JWT structure
 */
export const isValidJWTStructure = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  return parts.length === 3;
};