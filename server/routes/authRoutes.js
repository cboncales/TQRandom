import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  resetPasswordRequest,
  updatePassword,
  signInWithGoogle,
  handleOAuthCallback,
} from '../controllers/authController.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/reset-password-request', resetPasswordRequest);
router.get('/google', signInWithGoogle);
router.get('/callback', handleOAuthCallback);

// Protected routes (authentication required)
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getCurrentUser);
router.put('/password', authenticateUser, updatePassword);

export default router;

