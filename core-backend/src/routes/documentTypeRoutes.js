const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/document-types - Get all document types
router.get('/', authenticate, documentTypeController.getAllDocumentTypes);

// POST /api/document-types - Create document type (admin only)
router.post('/', authenticate, authorize(['admin']), documentTypeController.createDocumentType);

module.exports = router;