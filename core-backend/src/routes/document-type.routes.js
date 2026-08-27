import express from 'express';
import * as documentTypeController from '../controllers/document-type.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/document-types - Get all document types
router.get('/', authenticate, documentTypeController.getAllDocumentTypes);

// POST /api/document-types - Create document type (admin only)
router.post('/', authenticate, authorize(['admin']), documentTypeController.createDocumentType);

export default router;
