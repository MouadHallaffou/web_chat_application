"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.updateMessageStatus = exports.sendMessage = exports.getMessages = void 0;
const message_model_1 = require("../models/message.model");
const error_handler_1 = require("../middlewares/error-handler");
const socket_service_1 = require("../services/socket.service");
const mongoose_1 = __importDefault(require("mongoose"));
const MESSAGES_PER_PAGE = 50;
const CACHE_TTL = 60; // 1 minute
const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || MESSAGES_PER_PAGE;
        const skip = (page - 1) * limit;
        // Validate conversationId
        if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            throw new error_handler_1.AppError(400, 'Invalid conversation ID');
        }
        // Get messages with pagination
        const messages = await message_model_1.Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
        // Get total count for pagination
        const total = await message_model_1.Message.countDocuments({ conversationId });
        res.status(200).json({
            status: 'success',
            data: {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { conversationId, content, type = 'text' } = req.body;
        const senderId = req.user?._id;
        if (!senderId) {
            throw new error_handler_1.AppError(401, 'Not authenticated');
        }
        // Validate conversationId
        if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            throw new error_handler_1.AppError(400, 'Invalid conversation ID');
        }
        // Create message
        const message = new message_model_1.Message({
            conversationId,
            senderId,
            content,
            type,
            status: 'sent'
        });
        await message.save({ session });
        // Update conversation last message
        await mongoose_1.default.model('Conversation').findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date()
        }, { session });
        await session.commitTransaction();
        session.endSession();
        // Emit message to conversation room
        socket_service_1.socketService.emitToRoom(conversationId, 'new_message', message);
        res.status(201).json({
            status: 'success',
            data: message
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};
exports.sendMessage = sendMessage;
const updateMessageStatus = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { status } = req.body;
        if (!['sent', 'delivered', 'read'].includes(status)) {
            throw new error_handler_1.AppError(400, 'Invalid message status');
        }
        const message = await message_model_1.Message.findByIdAndUpdate(messageId, { status }, { new: true });
        if (!message) {
            throw new error_handler_1.AppError(404, 'Message not found');
        }
        // Emit status update to conversation room
        socket_service_1.socketService.emitToRoom(message.conversationId.toString(), 'message_status_update', { messageId, status });
        res.status(200).json({
            status: 'success',
            data: message
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMessageStatus = updateMessageStatus;
const deleteMessage = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { messageId } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            throw new error_handler_1.AppError(401, 'Not authenticated');
        }
        const message = await message_model_1.Message.findOne({
            _id: messageId,
            senderId: userId
        });
        if (!message) {
            throw new error_handler_1.AppError(404, 'Message not found or unauthorized');
        }
        await message.deleteOne({ session });
        // Update conversation if this was the last message
        const lastMessage = await message_model_1.Message.findOne({ conversationId: message.conversationId })
            .sort({ createdAt: -1 })
            .select('_id');
        await mongoose_1.default.model('Conversation').findByIdAndUpdate(message.conversationId, {
            lastMessage: lastMessage?._id,
            updatedAt: new Date()
        }, { session });
        await session.commitTransaction();
        session.endSession();
        // Emit message deletion to conversation room
        socket_service_1.socketService.emitToRoom(message.conversationId.toString(), 'message_deleted', { messageId });
        res.status(200).json({
            status: 'success',
            message: 'Message deleted successfully'
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};
exports.deleteMessage = deleteMessage;
