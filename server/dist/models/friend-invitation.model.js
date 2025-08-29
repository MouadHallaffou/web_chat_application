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
exports.FriendInvitation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const friendInvitationSchema = new mongoose_1.Schema({
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
    message: {
        type: String,
        maxlength: 500
    },
    acceptedAt: {
        type: Date
    },
    rejectedAt: {
        type: Date
    }
}, {
    timestamps: true
});
// Compound indexes for efficient queries
friendInvitationSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
friendInvitationSchema.index({ receiverId: 1, status: 1 });
friendInvitationSchema.index({ senderId: 1, status: 1 });
friendInvitationSchema.index({ status: 1, createdAt: -1 });
// Prevent duplicate invitations
friendInvitationSchema.pre('save', async function (next) {
    if (this.isNew) {
        const existingInvitation = await this.constructor.findOne({
            $or: [
                { senderId: this.senderId, receiverId: this.receiverId },
                { senderId: this.receiverId, receiverId: this.senderId }
            ]
        });
        if (existingInvitation) {
            return next(new Error('An invitation already exists between these users'));
        }
    }
    next();
});
exports.FriendInvitation = mongoose_1.default.model('FriendInvitation', friendInvitationSchema);
