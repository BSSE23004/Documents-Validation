const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authController.refreshToken);

module.exports = router;