"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const error_handler_1 = require("../middlewares/error-handler");
const email_service_1 = require("../services/email.service");
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '30d',
    });
};
// Helper function to check if profile is complete
const isProfileComplete = (user) => {
    return !!user.avatar && user.username.length >= 3;
};
const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ?
                    'Email already registered' :
                    'Username already taken'
            });
        }
        // Generate verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Create new user
        const user = new user_model_1.User({
            username,
            email,
            password,
            verificationToken,
            tokenExpiry
        });
        await user.save();
        // Generate JWT token
        const token = generateToken(user._id.toString());
        try {
            // Send verification email using the email service
            await email_service_1.emailService.sendVerificationEmail(user.email, verificationToken);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Delete the user if email sending fails
            await user_model_1.User.findByIdAndDelete(user._id);
            return res.status(500).json({
                message: 'Failed to send verification email. Please try again later.'
            });
        }
        // Return user data without sensitive information
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified,
            status: user.status,
            lastSeen: user.lastSeen
        };
        return res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            token,
            user: userResponse,
            redirect: '/login'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await user_model_1.User.findOne({ email }).select('+password');
        if (!user) {
            throw new error_handler_1.AppError(401, 'Invalid email or password');
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new error_handler_1.AppError(401, 'Invalid email or password');
        }
        // Check if email is verified
        if (!user.isVerified) {
            throw new error_handler_1.AppError(401, 'Please verify your email first. Check your inbox for the verification link.');
        }
        // Update user status
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
        // Generate token
        const token = generateToken(user._id.toString());
        // Remove sensitive data from response
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.verificationToken;
        // Check if profile is complete
        const profileComplete = isProfileComplete(user);
        res.status(200).json({
            status: 'success',
            message: 'Login successful!',
            data: {
                user: userResponse,
                token,
                profileComplete,
                redirectTo: profileComplete ? '/chat' : '/profile/edit'
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        // Find user
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            throw new error_handler_1.AppError(404, 'User not found');
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();
        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        await email_service_1.emailService.sendResetPasswordEmail(user.email, resetUrl);
        res.status(200).json({
            status: 'success',
            message: 'Password reset email sent',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        // Find user with valid reset token
        const user = await user_model_1.User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            throw new error_handler_1.AppError(400, 'Invalid or expired reset token');
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
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        console.log(`[VERIFY_EMAIL] Received token: ${token}`);
        const user = await user_model_1.User.findOne({ verificationToken: token });
        if (!user) {
            console.log(`[VERIFY_EMAIL] User not found or token invalid/expired for token: ${token}`);
            throw new error_handler_1.AppError(400, 'Invalid or expired verification token');
        }
        console.log(`[VERIFY_EMAIL] User found. ID: ${user._id}, Email: ${user.email}, isVerified (before update): ${user.isVerified}`);
        user.isVerified = true;
        user.verificationToken = undefined;
        console.log(`[VERIFY_EMAIL] isVerified (after update, before save): ${user.isVerified}, verificationToken (after update): ${user.verificationToken}`);
        const saveResult = await user.save();
        console.log(`[VERIFY_EMAIL] User saved. isVerified (after save): ${user.isVerified}, Save result:`, saveResult);
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully! You can now login.',
            redirectTo: '/login'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const logout = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new error_handler_1.AppError(401, 'Not authenticated');
        }
        // Update user status
        await user_model_1.User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: new Date(),
        });
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
