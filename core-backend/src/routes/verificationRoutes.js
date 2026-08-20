const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  validateVerifyQRCode,
  validateVerifyReference,
  validateGetVerificationLogsQuery,
  validateVerificationLogId
} = require('../middleware/validationMiddleware');

/**
 * Verification Routes
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

module.exports = router;