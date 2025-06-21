import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { AppError } from '../middlewares/error-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?._id?.toString() || 'unknown';
    const uploadDir = `uploads/avatars/${userId}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
}).single('avatar');

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(400, err.message));
      }

      const { username, email, password } = req.body;
      const userId = req.user._id;

      // Check if username is already taken
      if (username) {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          return next(new AppError(400, 'Username is already taken'));
        }
      }

      // Check if email is already taken
      if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) {
          return next(new AppError(400, 'Email is already taken'));
        }
      }

      // Update user profile
      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password && password.length >= 6) {
        // Hash password before saving
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      if (req.file) {
        // Delete old avatar if exists
        const user = await User.findById(userId);
        if (user?.avatar) {
          const oldAvatarPath = path.join(process.cwd(), user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        // Store relative path for client access
        updateData.avatar = `/uploads/avatars/${userId}/${req.file.filename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return next(new AppError(404, 'User not found'));
      }

      // Remove sensitive data from response
      const userResponse = updatedUser.toObject();
      delete (userResponse as any).password;
      delete (userResponse as any).verificationToken;

      // Générer un nouveau token si email ou mot de passe changé
      let token = null;
      if (email || password) {
        token = updatedUser.generateAuthToken();
      }

      res.status(200).json({
        status: 'success',
        data: {
          user: userResponse,
          token,
          redirectTo: '/chat'
        }
      });
    });
  } catch (error) {
    next(error);
  }
}; 