import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

export default router; 