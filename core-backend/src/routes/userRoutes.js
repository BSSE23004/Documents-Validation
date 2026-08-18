const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticate, userController.getCurrentUserProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, userController.updateUserProfile);

// GET /api/users/sessions - Get user sessions
router.get('/sessions', authenticate, userController.getUserSessions);

module.exports = router;