"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// Public routes
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.post('/verify-email', auth_controller_1.verifyEmail);
// Google OAuth routes
router.get('/google', auth_controller_1.googleAuth);
router.get('/google/callback', auth_controller_1.googleCallback);
// GitHub OAuth routes
router.get('/github', auth_controller_1.githubAuth);
router.get('/github/callback', auth_controller_1.githubCallback);
// LinkedIn OAuth routes
router.get('/linkedin', auth_controller_1.linkedinAuth);
router.get('/linkedin/callback', auth_controller_1.linkedinCallback);
// Protected routes
router.post('/logout', auth_1.authenticate, auth_controller_1.logout);
router.get('/me', auth_1.authenticate, auth_controller_1.getMe);
exports.default = router;
