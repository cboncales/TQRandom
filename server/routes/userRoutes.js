import express from 'express';
import { updateProfile, updatePassword, getProfile } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', authenticateUser, getProfile);

/**
 * PUT /api/user/profile
 * Update user profile (name)
 */
router.put('/profile', authenticateUser, updateProfile);

/**
 * PUT /api/user/password
 * Update user password
 */
router.put('/password', authenticateUser, updatePassword);

export default router;

