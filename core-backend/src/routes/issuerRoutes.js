const express = require('express');
const router = express.Router();
const issuerController = require('../controllers/issuerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/issuers - Get all issuers
router.get('/', authenticate, issuerController.getAllIssuers);

// POST /api/issuers - Create issuer (admin only)
router.post('/', authenticate, authorize(['admin']), issuerController.createIssuer);

module.exports = router;