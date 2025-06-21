"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = void 0;
const user_model_1 = require("../models/user.model");
const error_handler_1 = require("../middlewares/error-handler");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for file upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/avatars';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
        }
    }
}).single('avatar');
const updateProfile = async (req, res, next) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return next(new error_handler_1.AppError(400, err.message));
            }
            const { username } = req.body;
            const userId = req.user._id;
            // Check if username is already taken
            if (username) {
                const existingUser = await user_model_1.User.findOne({ username, _id: { $ne: userId } });
                if (existingUser) {
                    return next(new error_handler_1.AppError(400, 'Username is already taken'));
                }
            }
            // Update user profile
            const updateData = {};
            if (username)
                updateData.username = username;
            if (req.file) {
                // Delete old avatar if exists
                const user = await user_model_1.User.findById(userId);
                if (user?.avatar) {
                    const oldAvatarPath = path_1.default.join(process.cwd(), user.avatar);
                    if (fs_1.default.existsSync(oldAvatarPath)) {
                        fs_1.default.unlinkSync(oldAvatarPath);
                    }
                }
                updateData.avatar = req.file.path;
            }
            const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
            if (!updatedUser) {
                return next(new error_handler_1.AppError(404, 'User not found'));
            }
            // Remove sensitive data from response
            const userResponse = updatedUser.toObject();
            delete userResponse.password;
            delete userResponse.verificationToken;
            res.status(200).json({
                status: 'success',
                data: {
                    user: userResponse,
                    redirectTo: '/chat'
                }
            });
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
