import express from 'express';
import * as issuerController from '../controllers/issuer.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/issuers - Get all issuers
router.get('/', authenticate, issuerController.getAllIssuers);

// POST /api/issuers - Create issuer (admin only)
router.post('/', authenticate, authorize(['admin']), issuerController.createIssuer);

export default router;
