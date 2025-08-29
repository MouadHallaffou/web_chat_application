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
exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'audio', 'video'],
        default: 'text'
    },
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message'
    },
    metadata: {
        fileName: String,
        fileSize: Number,
        fileType: String,
        filePath: String,
        mimeType: String,
        thumbnailUrl: String,
        isEdited: Boolean,
        editedAt: Date
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    readBy: [{
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            readAt: {
                type: Date,
                required: true
            }
        }]
}, {
    timestamps: true
});
// Index pour améliorer les performances de recherche
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
// Méthode pour vérifier si un message a été lu par un utilisateur
messageSchema.methods.isReadBy = function (userId) {
    return this.readBy.some((readEntry) => readEntry.userId.toString() === userId.toString());
};
// Méthode pour marquer comme lu par un utilisateur
messageSchema.methods.markAsReadBy = function (userId) {
    if (!this.isReadBy(userId)) {
        this.readBy.push({
            userId,
            readAt: new Date()
        });
    }
};
// Virtuel pour obtenir le nombre total de lectures
messageSchema.virtual('readCount').get(function () {
    return this.readBy.length;
});
// Middleware pour mettre à jour le status automatiquement
messageSchema.pre('save', function (next) {
    if (this.readBy.length > 0) {
        this.status = 'read';
    }
    next();
});
exports.Message = mongoose_1.default.model('Message', messageSchema);
