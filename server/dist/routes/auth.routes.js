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
// Protected routes
router.post('/logout', auth_1.authenticate, auth_controller_1.logout);
router.get('/me', auth_1.authenticate, async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user,
        },
    });
});
exports.default = router;
