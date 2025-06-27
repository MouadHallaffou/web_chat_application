import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';
import { AppError } from '../middlewares/error-handler';
import { emailService } from '../services/email.service';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// Helper function to check if profile is complete
const isProfileComplete = (user: IUser): boolean => {
  return !!user.avatar && user.username.length >= 3;
};

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails?.[0].value });
    if (!user) {
      user = await User.create({
        email: profile.emails?.[0].value,
        username: profile.displayName,
        isVerified: true,
        password: Math.random().toString(36).slice(-8), // mot de passe aléatoire
        status: 'online'
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

// Configure GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: '/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('GitHub profile:', profile);
    let email = profile.emails?.[0]?.value;

    if (!email) {
      const fetch = require('node-fetch');
      const res = await fetch('https://api.github.com/user/emails', {
        headers: { 'Authorization': `token ${accessToken}` }
      });
      const emails = await res.json();
      console.log('GitHub emails API response:', emails);
      email = Array.isArray(emails)
        ? emails.find((e) => e.primary && e.verified)?.email
        : undefined;
    }

    if (!email) {
      console.error('No email found in GitHub profile or API');
      return done(new Error('No email found in GitHub profile'), null);
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        username: profile.username || email.split('@')[0],
        isVerified: true,
        password: Math.random().toString(36).slice(-8),
        status: 'online'
      });
    }
    return done(null, user);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return done(error as Error);
  }
}));

// Configure LinkedIn Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  callbackURL: '/api/auth/linkedin/callback',
  scope: ['r_emailaddress', 'r_liteprofile']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails?.[0].value });
    
    if (!user) {
      user = await User.create({
        email: profile.emails?.[0].value,
        username: profile.displayName,
        isVerified: true, // Auto-verify social logins
        password: Math.random().toString(36).slice(-8), // Random password for social users
        status: 'online'
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    // Create user with auto-verification
    const user = new User({
      email,
      password,
      username,
      isVerified: true, // Auto-verify all users
      status: 'online'
    });

    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Social login routes
export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = [
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    if (!req.user) {
      return res.status(401).send('User not found after Google auth');
    }
    const token = (req.user as any).generateAuthToken();
    res.redirect(`${process.env.CLIENT_URL}/chat?token=${token}`);
  }
];

export const githubAuth = passport.authenticate('github', { scope: ['user:email'] });

export const githubCallback = [
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).send('User not found after GitHub auth');
    }
    const token = (req.user as any).generateAuthToken();
    res.redirect(`${process.env.CLIENT_URL}/chat?token=${token}`);
  }
];

export const linkedinAuth = passport.authenticate('linkedin');

export const linkedinCallback = passport.authenticate('linkedin', { 
  failureRedirect: '/login',
  session: false 
}, (req, res) => {
  const token = (req.user as any).generateAuthToken();
  res.redirect(`/auth/success?token=${token}`);
});

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await emailService.sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError(400, 'Verification token is required');
    }

    const user = await User.findOne({
      verificationToken: token,
      tokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    // Use transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.tokenExpiry = undefined;
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully! You can now login.',
        redirectTo: '/login'
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.isVerified) {
      throw new AppError(400, 'Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.tokenExpiry = tokenExpiry;
    await user.save();

    // Send new verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      status: 'success',
      message: 'Verification email has been resent. Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError(401, 'Not authenticated');
    }

    // Update user status
    await User.findByIdAndUpdate(userId, {
      status: 'offline',
      lastSeen: new Date(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
}; 