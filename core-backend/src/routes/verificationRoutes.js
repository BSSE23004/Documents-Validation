const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// POST /api/verify/qr-code - Verify document by QR code (public endpoint)
router.post('/qr-code', verificationController.verifyByQRCode);

// POST /api/verify/reference - Verify document by reference number (public endpoint)
router.post('/reference', verificationController.verifyByReference);

// GET /api/verify/logs - Get verification logs (admin/verifier only)
router.get('/logs', authenticate, authorize(['admin', 'verifier']), verificationController.getVerificationLogs);

module.exports = router;