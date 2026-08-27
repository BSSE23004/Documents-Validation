import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticate, userController.getCurrentUserProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, userController.updateUserProfile);

// GET /api/users/sessions - Get all active sessions for current user
router.get('/sessions', authenticate, userController.getUserSessions);

// DELETE /api/users/sessions/:sessionId - Revoke a specific session
router.delete('/sessions/:sessionId', authenticate, userController.revokeSession);

export default router;
