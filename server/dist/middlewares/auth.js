"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const error_handler_1 = require("./error-handler");
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new error_handler_1.AppError(401, 'Not authenticated');
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Get user from token
        const user = await user_model_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            throw new error_handler_1.AppError(401, 'User not found');
        }
        // Check if user is verified
        if (!user.isVerified) {
            throw new error_handler_1.AppError(401, 'Please verify your email first');
        }
        // Update user status
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
        // Attach user to request
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_handler_1.AppError(401, 'Invalid token'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
