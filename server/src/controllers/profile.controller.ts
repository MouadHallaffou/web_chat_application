import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { AppError } from '../middlewares/error-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
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

      const { username } = req.body;
      const userId = req.user._id;

      // Check if username is already taken
      if (username) {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          return next(new AppError(400, 'Username is already taken'));
        }
      }

      // Update user profile
      const updateData: any = {};
      if (username) updateData.username = username;
      if (req.file) {
        // Delete old avatar if exists
        const user = await User.findById(userId);
        if (user?.avatar) {
          const oldAvatarPath = path.join(process.cwd(), user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        updateData.avatar = req.file.path;
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

      res.status(200).json({
        status: 'success',
        data: {
          user: userResponse,
          redirectTo: '/chat'
        }
      });
    });
  } catch (error) {
    next(error);
  }
}; 