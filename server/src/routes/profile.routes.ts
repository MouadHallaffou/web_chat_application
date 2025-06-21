import express from 'express';
import { updateProfile } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// Protected routes
router.put('/edit', authenticate, updateProfile);

export default router; 