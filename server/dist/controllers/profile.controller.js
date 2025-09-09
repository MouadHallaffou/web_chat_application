"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateProfile = void 0;
const user_model_1 = require("../models/user.model");
const error_handler_1 = require("../middlewares/error-handler");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for file upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const userId = (req.user?._id?.toString()) || 'unknown';
        const uploadDir = `uploads/avatars/${userId}`;
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
            const { username, email, password, removeAvatar } = req.body;
            const userId = req.user?._id;
            if (!userId) {
                return next(new error_handler_1.AppError(401, 'Not authenticated'));
            }
            // Check if username is already taken
            if (username) {
                const existingUser = await user_model_1.User.findOne({ username, _id: { $ne: userId } });
                if (existingUser) {
                    return next(new error_handler_1.AppError(400, 'Username is already taken'));
                }
            }
            // Check if email is already taken
            if (email) {
                const existingEmail = await user_model_1.User.findOne({ email, _id: { $ne: userId } });
                if (existingEmail) {
                    return next(new error_handler_1.AppError(400, 'Email is already taken'));
                }
            }
            // Update user profile
            const updateData = {};
            if (username)
                updateData.username = username;
            if (email)
                updateData.email = email;
            // Validation et hashage du mot de passe
            if (password) {
                if (password.length < 8) {
                    return next(new error_handler_1.AppError(400, 'Le mot de passe doit contenir au moins 8 caractères'));
                }
                // Hash password before saving
                const bcrypt = require('bcryptjs');
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }
            // Handle avatar update or removal
            const user = await user_model_1.User.findById(userId);
            if (removeAvatar === 'true') {
                // Remove avatar - delete old file and set avatar to null
                if (user?.avatar) {
                    const oldAvatarPath = path_1.default.join(process.cwd(), user.avatar);
                    if (fs_1.default.existsSync(oldAvatarPath)) {
                        try {
                            fs_1.default.unlinkSync(oldAvatarPath);
                        }
                        catch (error) {
                            console.error('Error deleting old avatar file:', error);
                        }
                    }
                }
                updateData.avatar = null;
            }
            else if (req.file) {
                // Upload new avatar - delete old one if exists
                if (user?.avatar) {
                    const oldAvatarPath = path_1.default.join(process.cwd(), user.avatar);
                    if (fs_1.default.existsSync(oldAvatarPath)) {
                        try {
                            fs_1.default.unlinkSync(oldAvatarPath);
                        }
                        catch (error) {
                            console.error('Error deleting old avatar file:', error);
                        }
                    }
                }
                // Store relative path for client access
                updateData.avatar = `/uploads/avatars/${userId}/${req.file.filename}`;
            }
            const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
            if (!updatedUser) {
                return next(new error_handler_1.AppError(404, 'User not found'));
            }
            // Remove sensitive data from response
            const userResponse = updatedUser.toObject();
            delete userResponse.password;
            delete userResponse.verificationToken;
            // Générer un nouveau token si email ou mot de passe changé
            let token = null;
            if (email || password) {
                try {
                    token = updatedUser.generateAuthToken();
                }
                catch (tokenError) {
                    console.error('Error generating auth token:', tokenError);
                    // Continue without token - user will need to login again
                }
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
    }
    catch (error) {
        console.error('Profile update error:', error);
        // More specific error handling
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                if (error.message.includes('username')) {
                    return next(new error_handler_1.AppError(400, 'Ce nom d\'utilisateur est déjà utilisé'));
                }
                else if (error.message.includes('email')) {
                    return next(new error_handler_1.AppError(400, 'Cette adresse email est déjà utilisée'));
                }
            }
            return next(new error_handler_1.AppError(500, `Erreur de mise à jour du profil: ${error.message}`));
        }
        next(new error_handler_1.AppError(500, 'Erreur interne du serveur lors de la mise à jour du profil'));
    }
};
exports.updateProfile = updateProfile;
const deleteAccount = async (req, res, next) => {
    try {
        const { reason, feedback, password } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return next(new error_handler_1.AppError(401, 'Non authentifié'));
        }
        if (!reason) {
            return next(new error_handler_1.AppError(400, 'La cause de suppression est obligatoire'));
        }
        if (!password) {
            return next(new error_handler_1.AppError(400, 'Le mot de passe est requis pour confirmer la suppression'));
        }
        // Vérifier le mot de passe
        const user = await user_model_1.User.findById(userId).select('+password');
        if (!user) {
            return next(new error_handler_1.AppError(404, 'Utilisateur non trouvé'));
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return next(new error_handler_1.AppError(400, 'Mot de passe incorrect'));
        }
        // Supprimer l'avatar s'il existe
        if (user.avatar) {
            const avatarPath = path_1.default.join(process.cwd(), user.avatar);
            if (fs_1.default.existsSync(avatarPath)) {
                try {
                    fs_1.default.unlinkSync(avatarPath);
                }
                catch (error) {
                    console.error('Erreur lors de la suppression de l\'avatar:', error);
                }
            }
            // Supprimer le dossier de l'utilisateur
            const userDir = path_1.default.join(process.cwd(), 'uploads', 'avatars', userId.toString());
            if (fs_1.default.existsSync(userDir)) {
                try {
                    fs_1.default.rmSync(userDir, { recursive: true, force: true });
                }
                catch (error) {
                    console.error('Erreur lors de la suppression du dossier utilisateur:', error);
                }
            }
        }
        // Log de la suppression (pour analytics)
        console.log('Account deletion:', {
            userId: userId.toString(),
            email: user.email,
            username: user.username,
            reason,
            feedback: feedback || 'Aucun commentaire',
            timestamp: new Date().toISOString()
        });
        // TODO: Ici, vous pouvez ajouter la logique pour supprimer les données associées
        // - Messages dans les conversations
        // - Conversations où l'utilisateur était membre
        // - Invitations d'amis envoyées/reçues
        // - Notifications
        // Exemple :
        // await Message.deleteMany({ sender: userId });
        // await Conversation.updateMany(
        //   { participants: userId },
        //   { $pull: { participants: userId } }
        // );
        // Supprimer le compte utilisateur
        await user_model_1.User.findByIdAndDelete(userId);
        res.status(200).json({
            status: 'success',
            message: 'Votre compte a été supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        next(new error_handler_1.AppError(500, 'Erreur interne lors de la suppression du compte'));
    }
};
exports.deleteAccount = deleteAccount;
