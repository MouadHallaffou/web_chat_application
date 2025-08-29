"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const conversationSchema = new mongoose_1.Schema({
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct'
    },
    name: {
        type: String,
        maxlength: 100
    },
    lastMessage: {
        content: String,
        senderId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });
conversationSchema.index({ isActive: 1 });
// Ensure participants are unique and sorted
conversationSchema.pre('save', function (next) {
    if (this.participants) {
        this.participants = [...new Set(this.participants)].sort();
    }
    next();
});
// Static method to find or create direct conversation between two users
conversationSchema.statics.findOrCreateDirectConversation = async function (user1Id, user2Id) {
    const participants = [user1Id, user2Id].sort();
    let conversation = await this.findOne({
        participants: { $all: participants },
        type: 'direct'
    });
    if (!conversation) {
        conversation = new this({
            participants,
            type: 'direct'
        });
        await conversation.save();
    }
    return conversation;
};
// Static method to get conversations for a user
conversationSchema.statics.getUserConversations = function (userId) {
    return this.find({
        participants: userId,
        isActive: true
    })
        .populate('participants', 'username email avatar status lastSeen')
        .populate('lastMessage.senderId', 'username')
        .sort({ 'lastMessage.timestamp': -1 });
};
// Method to mark messages as read for a user
conversationSchema.methods.markAsRead = function (userId) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};
// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function (userId) {
    const currentCount = this.unreadCount.get(userId.toString()) || 0;
    this.unreadCount.set(userId.toString(), currentCount + 1);
    return this.save();
};
exports.Conversation = mongoose_1.default.model('Conversation', conversationSchema);
