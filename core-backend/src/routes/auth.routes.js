import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user (current session)
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authenticate, authController.logoutAll);

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authController.refreshToken);

// GET /api/auth/sessions - Get current user sessions
router.get('/sessions', authenticate, authController.getSessions);

// DELETE /api/auth/sessions/:sessionId - Revoke specific session
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

export default router;
