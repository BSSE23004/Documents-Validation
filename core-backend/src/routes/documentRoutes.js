const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  validateCreateDocument,
  validateUpdateDocument,
  validateDocumentId,
  validateGetDocumentsQuery
} = require('../middleware/validationMiddleware');

/**
 * Document Management Routes
 * Specification Section 4.4
 */

// POST /api/documents - Create/Upload a new document (admin, issuer)
router.post(
  '/',
  authenticate,
  authorize(['admin', 'issuer']),
  validateCreateDocument,
  documentController.createDocument
);

// GET /api/documents - Get all documents with pagination, search, and filters (authenticated users)
router.get(
  '/',
  authenticate,
  validateGetDocumentsQuery,
  documentController.getAllDocuments
);

// GET /api/documents/:id - Get document by ID (authenticated users, RBAC checked in service)
router.get(
  '/:id',
  authenticate,
  validateDocumentId,
  documentController.getDocumentById
);

// PUT /api/documents/:id - Update document (admin, issuer)
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'issuer']),
  validateUpdateDocument,
  documentController.updateDocument
);

// PATCH /api/documents/:id - Partial update document (admin, issuer)
router.patch(
  '/:id',
  authenticate,
  authorize(['admin', 'issuer']),
  validateUpdateDocument,
  documentController.updateDocument
);

// DELETE /api/documents/:id - Delete document (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateDocumentId,
  documentController.deleteDocument
);

module.exports = router;