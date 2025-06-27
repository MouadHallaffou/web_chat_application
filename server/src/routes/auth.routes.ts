import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  linkedinAuth,
  linkedinCallback,
  getMe
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);

// Google OAuth routes
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleCallback);

// GitHub OAuth routes
router.get('/auth/github', githubAuth);
router.get('/auth/github/callback', githubCallback);

// LinkedIn OAuth routes
router.get('/auth/linkedin', linkedinAuth);
router.get('/auth/linkedin/callback', linkedinCallback);

// Protected routes
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, getMe);

export default router; 