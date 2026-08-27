import { validationResult, body, param, query } from 'express-validator';
import { DOCUMENT_STATUS, VERIFICATION_STATUS } from '../config/constants.js';
import ApiResponse from '../utils/api-response.js';

/**
 * Validation Middleware (ESM)
 * Handles request validation and error formatting matching Technical Specification Section 5.2.2 & Section 8.1
 */

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return ApiResponse.validationError(res, {
      message: 'Input validation failed',
      data: {
        code: 'VALIDATION_INVALID_INPUT',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      }
    });
  }
  
  next();
};

/**
 * UUID validation regex (matches standard 8-4-4-4-12 hex UUID format)
 */
export const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const isValidUUID = (value) => {
  return typeof value === 'string' && UUID_REGEX.test(value);
};

/**
 * Email validation helper
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation helper
 */
export const isValidPassword = (password) => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// ==========================================
// Document Management Validation Rules
// ==========================================

export const validateCreateDocument = [
  body('documentTypeId')
    .notEmpty().withMessage('documentTypeId is required')
    .matches(UUID_REGEX).withMessage('documentTypeId must be a valid UUID'),
  body('issuerId')
    .notEmpty().withMessage('issuerId is required')
    .matches(UUID_REGEX).withMessage('issuerId must be a valid UUID'),
  body('recipientName')
    .trim()
    .notEmpty().withMessage('recipientName is required')
    .isLength({ min: 2, max: 100 }).withMessage('recipientName must be between 2 and 100 characters'),
  body('recipientEmail')
    .trim()
    .notEmpty().withMessage('recipientEmail is required')
    .isEmail().withMessage('recipientEmail must be a valid email address')
    .normalizeEmail(),
  body('title')
    .trim()
    .notEmpty().withMessage('title is required')
    .isLength({ min: 2, max: 200 }).withMessage('title must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('description must be less than 1000 characters'),
  body('referenceNumber')
    .trim()
    .notEmpty().withMessage('referenceNumber is required')
    .isLength({ min: 2, max: 100 }).withMessage('referenceNumber must be between 2 and 100 characters'),
  body('issuanceDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('issuanceDate must be a valid ISO 8601 date'),
  body('expiryDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('expiryDate must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.body.issuanceDate) {
        if (new Date(value) <= new Date(req.body.issuanceDate)) {
          throw new Error('expiryDate must be after issuanceDate');
        }
      }
      return true;
    }),
  body('metadata')
    .optional({ nullable: true })
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error('metadata must be a valid JSON object or JSON string');
        }
      }
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('metadata must be a valid JSON object');
      }
      return true;
    }),
  validate
];

export const validateUpdateDocument = [
  param('id')
    .matches(UUID_REGEX).withMessage('Document ID must be a valid UUID'),
  body('status')
    .optional()
    .isIn(Object.values(DOCUMENT_STATUS))
    .withMessage(`status must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}`),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('title cannot be empty')
    .isLength({ min: 2, max: 200 }).withMessage('title must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('description must be less than 1000 characters'),
  body('recipientName')
    .optional()
    .trim()
    .notEmpty().withMessage('recipientName cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('recipientName must be between 2 and 100 characters'),
  body('recipientEmail')
    .optional()
    .trim()
    .isEmail().withMessage('recipientEmail must be a valid email address')
    .normalizeEmail(),
  body('expiryDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('expiryDate must be a valid ISO 8601 date'),
  body('metadata')
    .optional({ nullable: true })
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error('metadata must be a valid JSON object or JSON string');
        }
      }
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('metadata must be a valid JSON object');
      }
      return true;
    }),
  validate
];

export const validateDocumentId = [
  param('id')
    .matches(UUID_REGEX).withMessage('Document ID must be a valid UUID'),
  validate
];

export const validateGetDocumentsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(Object.values(DOCUMENT_STATUS))
    .withMessage(`status must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}`),
  query('documentTypeId')
    .optional()
    .matches(UUID_REGEX).withMessage('documentTypeId must be a valid UUID'),
  query('issuerId')
    .optional()
    .matches(UUID_REGEX).withMessage('issuerId must be a valid UUID'),
  query('recipientEmail')
    .optional()
    .isEmail().withMessage('recipientEmail must be a valid email address')
    .normalizeEmail(),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('search term must be less than 100 characters'),
  validate
];

// ==========================================
// Verification Validation Rules
// ==========================================

export const validateVerifyQRCode = [
  body('qrCodeId')
    .trim()
    .notEmpty().withMessage('qrCodeId is required'),
  validate
];

export const validateVerifyReference = [
  body('referenceNumber')
    .trim()
    .notEmpty().withMessage('referenceNumber is required'),
  validate
];

export const validateGetVerificationLogsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(Object.values(VERIFICATION_STATUS))
    .withMessage(`status must be one of: ${Object.values(VERIFICATION_STATUS).join(', ')}`),
  query('documentId')
    .optional()
    .matches(UUID_REGEX).withMessage('documentId must be a valid UUID'),
  query('qrCodeId')
    .optional()
    .trim(),
  query('startDate')
    .optional()
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  validate
];

export const validateVerificationLogId = [
  param('id')
    .matches(UUID_REGEX).withMessage('Verification log ID must be a valid UUID'),
  validate
];

export default {
  validate,
  isValidEmail,
  isValidPassword,
  isValidUUID,
  validateCreateDocument,
  validateUpdateDocument,
  validateDocumentId,
  validateGetDocumentsQuery,
  validateVerifyQRCode,
  validateVerifyReference,
  validateGetVerificationLogsQuery,
  validateVerificationLogId
};
