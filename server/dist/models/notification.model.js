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
exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const notificationSchema = new mongoose_1.Schema({
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    type: {
        type: String,
        enum: ['friend_request', 'friend_accepted', 'message', 'system', 'mention'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        conversationId: mongoose_1.Schema.Types.ObjectId,
        messageId: mongoose_1.Schema.Types.ObjectId,
        invitationId: mongoose_1.Schema.Types.ObjectId,
        // Permet des données supplémentaires flexibles
        type: mongoose_1.Schema.Types.Mixed
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});
// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, isDeleted: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
// Static method to create notification
notificationSchema.statics.createNotification = function (data) {
    return new this(data).save();
};
// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function (userId, options = {}) {
    const { limit = 20, skip = 0, unreadOnly = false } = options;
    const query = {
        recipientId: userId,
        isDeleted: false
    };
    if (unreadOnly) {
        query.isRead = false;
    }
    return this.find(query)
        .populate('senderId', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};
// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function (userId, notificationIds) {
    const query = {
        recipientId: userId,
        isRead: false
    };
    if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
    }
    return this.updateMany(query, {
        isRead: true,
        readAt: new Date()
    });
};
// Static method to delete notifications
notificationSchema.statics.deleteNotifications = function (userId, notificationIds) {
    return this.updateMany({
        recipientId: userId,
        _id: { $in: notificationIds }
    }, {
        isDeleted: true
    });
};
// Method to mark single notification as read
notificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};
exports.Notification = mongoose_1.default.model('Notification', notificationSchema);
