import express from 'express';
import { updateProfile, deleteAccount } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// Protected routes
router.put('/edit', authenticate, updateProfile);
router.delete('/delete', authenticate, deleteAccount);

export default router; 