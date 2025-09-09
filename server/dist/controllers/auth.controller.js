"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.resendVerificationEmail = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.linkedinCallback = exports.linkedinAuth = exports.githubCallback = exports.githubAuth = exports.googleCallback = exports.googleAuth = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const error_handler_1 = require("../middlewares/error-handler");
const email_service_1 = require("../services/email.service");
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const passport_linkedin_oauth2_1 = require("passport-linkedin-oauth2");
const node_fetch_1 = __importDefault(require("node-fetch"));
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '30d',
    });
};
// Helper function to check if profile is complete
const isProfileComplete = (user) => {
    return !!user.avatar && user.username.length >= 3;
};
// Configure Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found in Google profile'), false);
        }
        let user = await user_model_1.User.findOne({ email });
        if (!user) {
            // Générer un nom d'utilisateur unique si nécessaire
            let username = profile.displayName || email.split('@')[0];
            // Vérifier si le nom d'utilisateur existe déjà
            const existingUsername = await user_model_1.User.findOne({ username });
            if (existingUsername) {
                // Ajouter un suffixe numérique pour rendre unique
                const timestamp = Date.now().toString().slice(-4);
                username = `${username}_${timestamp}`;
            }
            user = await user_model_1.User.create({
                email,
                username,
                isVerified: true,
                password: crypto_1.default.randomBytes(16).toString('hex'), // mot de passe aléatoire plus sécurisé
                status: 'online'
            });
        }
        return done(null, user);
    }
    catch (error) {
        console.error('Google OAuth error:', error);
        return done(error);
    }
}));
// Configure GitHub Strategy
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('GitHub profile:', profile);
        let email = profile.emails?.[0]?.value;
        if (!email) {
            const res = await (0, node_fetch_1.default)('https://api.github.com/user/emails', {
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
            return done(new Error('No email found in GitHub profile'), false);
        }
        let user = await user_model_1.User.findOne({ email });
        if (!user) {
            // Générer un nom d'utilisateur unique
            let username = profile.username || email.split('@')[0];
            // Vérifier si le nom d'utilisateur existe déjà
            const existingUsername = await user_model_1.User.findOne({ username });
            if (existingUsername) {
                // Ajouter un suffixe numérique pour rendre unique
                const timestamp = Date.now().toString().slice(-4);
                username = `${username}_${timestamp}`;
            }
            user = await user_model_1.User.create({
                email,
                username,
                isVerified: true,
                password: crypto_1.default.randomBytes(16).toString('hex'),
                status: 'online'
            });
        }
        return done(null, user);
    }
    catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error);
    }
}));
// Configure LinkedIn Strategy
passport_1.default.use(new passport_linkedin_oauth2_1.Strategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: '/api/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found in LinkedIn profile'), false);
        }
        let user = await user_model_1.User.findOne({ email });
        if (!user) {
            // Générer un nom d'utilisateur unique
            let username = profile.displayName || email.split('@')[0];
            // Vérifier si le nom d'utilisateur existe déjà
            const existingUsername = await user_model_1.User.findOne({ username });
            if (existingUsername) {
                // Ajouter un suffixe numérique pour rendre unique
                const timestamp = Date.now().toString().slice(-4);
                username = `${username}_${timestamp}`;
            }
            user = await user_model_1.User.create({
                email,
                username,
                isVerified: true,
                password: crypto_1.default.randomBytes(16).toString('hex'),
                status: 'online'
            });
        }
        return done(null, user);
    }
    catch (error) {
        console.error('LinkedIn OAuth error:', error);
        return done(error);
    }
}));
const register = async (req, res, next) => {
    try {
        const { email, password, username } = req.body;
        // Check if user already exists by email
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            throw new error_handler_1.AppError(400, 'Email already registered');
        }
        // Ensure username is unique for registration
        let finalUsername = username;
        const existingUsername = await user_model_1.User.findOne({ username });
        if (existingUsername) {
            // Add a random suffix to make it unique
            const timestamp = Date.now().toString().slice(-4);
            finalUsername = `${username}_${timestamp}`;
        }
        // Create user with auto-verification
        const user = new user_model_1.User({
            email,
            password,
            username: finalUsername,
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
    }
    catch (error) {
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            if (error.message.includes('email')) {
                return next(new error_handler_1.AppError(400, 'Cette adresse email est déjà utilisée'));
            }
            return next(new error_handler_1.AppError(400, 'Données en doublon détectées'));
        }
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            throw new error_handler_1.AppError(401, 'Invalid email or password');
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// Social login routes
exports.googleAuth = passport_1.default.authenticate('google', { scope: ['profile', 'email'] });
exports.googleCallback = [
    passport_1.default.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        if (!req.user) {
            return res.status(401).send('User not found after Google auth');
        }
        const token = req.user.generateAuthToken();
        res.redirect(`${process.env.CLIENT_URL}/chat?token=${token}`);
    }
];
exports.githubAuth = passport_1.default.authenticate('github', { scope: ['user:email'] });
exports.githubCallback = [
    passport_1.default.authenticate('github', { failureRedirect: '/login', session: false }),
    (req, res) => {
        if (!req.user) {
            return res.status(401).send('User not found after GitHub auth');
        }
        const token = req.user.generateAuthToken();
        res.redirect(`${process.env.CLIENT_URL}/chat?token=${token}`);
    }
];
exports.linkedinAuth = passport_1.default.authenticate('linkedin');
exports.linkedinCallback = passport_1.default.authenticate('linkedin', { failureRedirect: '/login', session: false }, (req, res) => {
    if (!req.user)
        return res.status(401).send('User not found after LinkedIn auth');
    const token = req.user.generateAuthToken();
    res.redirect(`/auth/success?token=${token}`);
});
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        // Find user
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
            return res.status(200).json({
                status: 'success',
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
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
            message: 'If an account with that email exists, a password reset link has been sent.',
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
        if (!token) {
            throw new error_handler_1.AppError(400, 'Verification token is required');
        }
        const user = await user_model_1.User.findOne({
            verificationToken: token,
            tokenExpiry: { $gt: new Date() }
        });
        if (!user) {
            throw new error_handler_1.AppError(400, 'Invalid or expired verification token');
        }
        // Use transaction to ensure atomicity
        const session = await mongoose_1.default.startSession();
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
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            throw new error_handler_1.AppError(404, 'User not found');
        }
        if (user.isVerified) {
            throw new error_handler_1.AppError(400, 'Email is already verified');
        }
        // Generate new verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        user.verificationToken = verificationToken;
        user.tokenExpiry = tokenExpiry;
        await user.save();
        // Send new verification email
        await email_service_1.emailService.sendVerificationEmail(user.email, verificationToken);
        res.status(200).json({
            status: 'success',
            message: 'Verification email has been resent. Please check your inbox.'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
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
const getMe = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};
exports.getMe = getMe;
