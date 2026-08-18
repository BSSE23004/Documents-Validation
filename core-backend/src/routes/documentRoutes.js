const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// POST /api/documents - Create a new document
router.post('/', authenticate, authorize(['admin', 'issuer']), documentController.createDocument);

// GET /api/documents - Get all documents with pagination and filters
router.get('/', authenticate, documentController.getAllDocuments);

// GET /api/documents/:id - Get document by ID
router.get('/:id', authenticate, documentController.getDocumentById);

// PUT /api/documents/:id - Update document
router.put('/:id', authenticate, authorize(['admin', 'issuer']), documentController.updateDocument);

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticate, authorize(['admin']), documentController.deleteDocument);

module.exports = router;