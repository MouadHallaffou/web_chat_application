import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AppError } from './error-handler';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface User {
      _id: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Not authenticated');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError(401, 'User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new AppError(401, 'Please verify your email first');
    }

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
}; 