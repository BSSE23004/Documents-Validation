import express from 'express';
import * as verificationController from '../controllers/verification.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  validateVerifyQRCode,
  validateVerifyReference,
  validateGetVerificationLogsQuery,
  validateVerificationLogId
} from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Verification Routes (ESM)
 * Specification Section 4.5
 */

// POST /api/verify/qr-code - Verify document by QR code (public endpoint)
router.post(
  '/qr-code',
  validateVerifyQRCode,
  verificationController.verifyByQRCode
);

// POST /api/verify/reference - Verify document by reference number (public endpoint)
router.post(
  '/reference',
  validateVerifyReference,
  verificationController.verifyByReference
);

// GET /api/verify/logs - Get verification audit logs (admin, verifier only)
router.get(
  '/logs',
  authenticate,
  authorize(['admin', 'verifier']),
  validateGetVerificationLogsQuery,
  verificationController.getVerificationLogs
);

// GET /api/verify/logs/:id - Get single verification log record (admin, verifier only)
router.get(
  '/logs/:id',
  authenticate,
  authorize(['admin', 'verifier']),
  validateVerificationLogId,
  verificationController.getVerificationLogById
);

// PUT /api/verify/logs/:id - Update verification log record (admin only)
router.put(
  '/logs/:id',
  authenticate,
  authorize(['admin']),
  validateVerificationLogId,
  verificationController.updateVerificationLog
);

export default router;
