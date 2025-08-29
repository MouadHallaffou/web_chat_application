"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editMessage = exports.deleteMessage = exports.markAsRead = exports.sendFile = exports.sendMessage = exports.getMessages = exports.getOrCreateConversation = exports.getConversations = void 0;
const conversation_model_1 = require("../models/conversation.model");
const message_model_1 = require("../models/message.model");
const friendship_model_1 = require("../models/friendship.model");
const error_handler_1 = require("../middlewares/error-handler");
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configuration multer pour l'upload de fichiers
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads', 'messages');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Autoriser images, documents, audio, vidéo
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp3|wav|mp4|avi|mov/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new error_handler_1.AppError(400, 'Type de fichier non autorisé'));
        }
    }
});
// Récupérer toutes les conversations de l'utilisateur
const getConversations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const conversations = await conversation_model_1.Conversation.find({
            participants: userId
        })
            .populate('participants', 'username avatar status lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });
        // Enrichir avec les informations d'ami pour chaque conversation
        const enrichedConversations = await Promise.all(conversations.map(async (conversation) => {
            if (conversation.type === 'direct') {
                const friend = conversation.participants.find((p) => !p._id.equals(userId));
                if (friend) {
                    // Compter les messages non lus
                    const unreadCount = await message_model_1.Message.countDocuments({
                        conversationId: conversation._id,
                        senderId: { $ne: userId },
                        readBy: { $not: { $elemMatch: { userId: userId } } }
                    });
                    return {
                        id: conversation._id,
                        type: conversation.type,
                        friend: {
                            id: friend._id,
                            username: friend.username,
                            avatar: friend.avatar,
                            status: friend.status,
                            lastSeen: friend.lastSeen
                        },
                        lastMessage: conversation.lastMessage,
                        unreadCount,
                        updatedAt: conversation.updatedAt
                    };
                }
            }
            return {
                id: conversation._id,
                type: conversation.type,
                participants: conversation.participants,
                lastMessage: conversation.lastMessage,
                unreadCount: conversation.unreadCount?.get(userId.toString()) || 0,
                updatedAt: conversation.updatedAt
            };
        }));
        res.json({
            status: 'success',
            data: enrichedConversations
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getConversations = getConversations;
// Récupérer ou créer une conversation avec un ami
const getOrCreateConversation = async (req, res, next) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(friendId)) {
            return next(new error_handler_1.AppError(400, 'ID d\'ami invalide'));
        }
        // Vérifier que l'amitié existe
        const friendship = await friendship_model_1.Friendship.findOne({
            $or: [
                { user1Id: userId, user2Id: friendId },
                { user2Id: userId, user1Id: friendId }
            ],
            status: 'active'
        });
        if (!friendship) {
            return next(new error_handler_1.AppError(403, 'Vous devez être amis pour démarrer une conversation'));
        }
        // Chercher une conversation existante
        let conversation = await conversation_model_1.Conversation.findOne({
            type: 'direct',
            participants: { $all: [userId, friendId] }
        })
            .populate('participants', 'username avatar status lastSeen')
            .populate('lastMessage');
        // Si aucune conversation n'existe, en créer une
        if (!conversation) {
            conversation = new conversation_model_1.Conversation({
                type: 'direct',
                participants: [userId, friendId],
                unreadCount: new Map([
                    [userId.toString(), 0],
                    [friendId.toString(), 0]
                ])
            });
            await conversation.save();
            await conversation.populate('participants', 'username avatar status lastSeen');
        }
        const friend = conversation.participants.find((p) => !p._id.equals(userId));
        res.json({
            status: 'success',
            data: {
                id: conversation._id,
                type: conversation.type,
                friend: {
                    id: friend._id,
                    username: friend.username,
                    avatar: friend.avatar,
                    status: friend.status,
                    lastSeen: friend.lastSeen
                },
                lastMessage: conversation.lastMessage,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrCreateConversation = getOrCreateConversation;
// Récupérer les messages d'une conversation
const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(conversationId)) {
            return next(new error_handler_1.AppError(400, 'ID de conversation invalide'));
        }
        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await conversation_model_1.Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return next(new error_handler_1.AppError(403, 'Accès refusé à cette conversation'));
        }
        const skip = (Number(page) - 1) * Number(limit);
        const messages = await message_model_1.Message.find({ conversationId })
            .populate('senderId', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        // Inverser l'ordre pour avoir les plus anciens en premier
        messages.reverse();
        res.json({
            status: 'success',
            data: messages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                hasMore: messages.length === Number(limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMessages = getMessages;
// Envoyer un message texte
const sendMessage = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { content, replyToId } = req.body;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(conversationId)) {
            return next(new error_handler_1.AppError(400, 'ID de conversation invalide'));
        }
        if (!content || content.trim().length === 0) {
            return next(new error_handler_1.AppError(400, 'Le contenu du message ne peut pas être vide'));
        }
        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await conversation_model_1.Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return next(new error_handler_1.AppError(403, 'Accès refusé à cette conversation'));
        }
        // Vérifier le message de réponse s'il existe
        let replyTo = null;
        if (replyToId && mongoose_1.default.isValidObjectId(replyToId)) {
            replyTo = await message_model_1.Message.findOne({
                _id: replyToId,
                conversationId
            });
        }
        // Créer le message
        const message = new message_model_1.Message({
            conversationId,
            senderId: userId,
            type: 'text',
            content: content.trim(),
            replyTo: replyTo?._id,
            metadata: {
                isEdited: false
            }
        });
        await message.save();
        await message.populate('senderId', 'username avatar');
        if (replyTo) {
            await message.populate('replyTo');
        }
        // Mettre à jour la conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        // Incrémenter le compteur de messages non lus pour les autres participants
        conversation.participants.forEach(participantId => {
            if (!participantId.equals(userId)) {
                const participantIdStr = participantId.toString();
                if (!conversation.unreadCount)
                    conversation.unreadCount = new Map();
                const currentCount = conversation.unreadCount.get(participantIdStr) || 0;
                conversation.unreadCount.set(participantIdStr, currentCount + 1);
            }
        });
        await conversation.save();
        // TODO: Envoyer via Socket.io aux participants
        // socketService.sendToConversation(conversationId, 'new_message', message);
        res.status(201).json({
            status: 'success',
            data: message
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessage = sendMessage;
// Envoyer un fichier
const sendFile = async (req, res, next) => {
    try {
        const uploadSingle = upload.single('file');
        uploadSingle(req, res, async (err) => {
            if (err) {
                return next(err);
            }
            const { conversationId } = req.params;
            const userId = req.user._id;
            const file = req.file;
            if (!file) {
                return next(new error_handler_1.AppError(400, 'Aucun fichier fourni'));
            }
            if (!mongoose_1.default.isValidObjectId(conversationId)) {
                return next(new error_handler_1.AppError(400, 'ID de conversation invalide'));
            }
            // Vérifier que l'utilisateur fait partie de la conversation
            const conversation = await conversation_model_1.Conversation.findById(conversationId);
            if (!conversation || !conversation.participants.includes(userId)) {
                return next(new error_handler_1.AppError(403, 'Accès refusé à cette conversation'));
            }
            // Déterminer le type de fichier
            let messageType = 'file';
            if (file.mimetype.startsWith('image/'))
                messageType = 'image';
            else if (file.mimetype.startsWith('audio/'))
                messageType = 'audio';
            else if (file.mimetype.startsWith('video/'))
                messageType = 'video';
            // Créer le message
            const message = new message_model_1.Message({
                conversationId,
                senderId: userId,
                type: messageType,
                content: file.originalname,
                metadata: {
                    fileName: file.originalname,
                    filePath: `/uploads/messages/${file.filename}`,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    isEdited: false
                }
            });
            await message.save();
            await message.populate('senderId', 'username avatar');
            // Mettre à jour la conversation
            conversation.lastMessage = message._id;
            conversation.updatedAt = new Date();
            // Incrémenter les compteurs non lus
            conversation.participants.forEach(participantId => {
                if (!participantId.equals(userId)) {
                    const participantIdStr = participantId.toString();
                    if (!conversation.unreadCount)
                        conversation.unreadCount = new Map();
                    const currentCount = conversation.unreadCount.get(participantIdStr) || 0;
                    conversation.unreadCount.set(participantIdStr, currentCount + 1);
                }
            });
            await conversation.save();
            // TODO: Envoyer via Socket.io
            // socketService.sendToConversation(conversationId, 'new_message', message);
            res.status(201).json({
                status: 'success',
                data: message
            });
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendFile = sendFile;
// Marquer les messages comme lus
const markAsRead = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(conversationId)) {
            return next(new error_handler_1.AppError(400, 'ID de conversation invalide'));
        }
        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await conversation_model_1.Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return next(new error_handler_1.AppError(403, 'Accès refusé à cette conversation'));
        }
        // Marquer tous les messages non lus comme lus
        const result = await message_model_1.Message.updateMany({
            conversationId,
            senderId: { $ne: userId },
            'readBy.userId': { $ne: userId }
        }, {
            $push: {
                readBy: {
                    userId,
                    readAt: new Date()
                }
            }
        });
        // Réinitialiser le compteur de messages non lus
        if (conversation.unreadCount) {
            conversation.unreadCount.set(userId.toString(), 0);
            await conversation.save();
        }
        res.json({
            status: 'success',
            message: 'Messages marqués comme lus',
            data: { markedCount: result.modifiedCount }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAsRead = markAsRead;
// Supprimer un message
const deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(messageId)) {
            return next(new error_handler_1.AppError(400, 'ID de message invalide'));
        }
        const message = await message_model_1.Message.findById(messageId);
        if (!message) {
            return next(new error_handler_1.AppError(404, 'Message non trouvé'));
        }
        if (!message.senderId.equals(userId)) {
            return next(new error_handler_1.AppError(403, 'Vous ne pouvez supprimer que vos propres messages'));
        }
        // Si c'est un fichier, le supprimer du système de fichiers
        if (message.metadata?.filePath) {
            const fullPath = path_1.default.join(process.cwd(), message.metadata.filePath);
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
        }
        await message_model_1.Message.findByIdAndDelete(messageId);
        // TODO: Notifier via Socket.io
        // socketService.sendToConversation(message.conversationId, 'message_deleted', { messageId });
        res.json({
            status: 'success',
            message: 'Message supprimé'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMessage = deleteMessage;
// Éditer un message
const editMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(messageId)) {
            return next(new error_handler_1.AppError(400, 'ID de message invalide'));
        }
        if (!content || content.trim().length === 0) {
            return next(new error_handler_1.AppError(400, 'Le contenu ne peut pas être vide'));
        }
        const message = await message_model_1.Message.findById(messageId);
        if (!message) {
            return next(new error_handler_1.AppError(404, 'Message non trouvé'));
        }
        if (!message.senderId.equals(userId)) {
            return next(new error_handler_1.AppError(403, 'Vous ne pouvez éditer que vos propres messages'));
        }
        if (message.type !== 'text') {
            return next(new error_handler_1.AppError(400, 'Vous ne pouvez éditer que les messages texte'));
        }
        message.content = content.trim();
        message.metadata = {
            ...message.metadata,
            isEdited: true,
            editedAt: new Date()
        };
        await message.save();
        // TODO: Notifier via Socket.io
        // socketService.sendToConversation(message.conversationId, 'message_edited', message);
        res.json({
            status: 'success',
            data: message
        });
    }
    catch (error) {
        next(error);
    }
};
exports.editMessage = editMessage;
