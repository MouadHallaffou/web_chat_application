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
exports.Friendship = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const friendshipSchema = new mongoose_1.Schema({
    user1Id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    user2Id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    },
    blockedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastInteractionAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Compound indexes for efficient queries
friendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
friendshipSchema.index({ user1Id: 1, status: 1 });
friendshipSchema.index({ user2Id: 1, status: 1 });
friendshipSchema.index({ status: 1, lastInteractionAt: -1 });
// Ensure user1Id is always the smaller ObjectId for consistency
friendshipSchema.pre('save', function (next) {
    if (this.user1Id.toString() > this.user2Id.toString()) {
        [this.user1Id, this.user2Id] = [this.user2Id, this.user1Id];
    }
    next();
});
// Static method to find friendship between two users
friendshipSchema.statics.findFriendship = function (user1Id, user2Id) {
    const [smallerId, largerId] = user1Id.toString() < user2Id.toString() ? [user1Id, user2Id] : [user2Id, user1Id];
    return this.findOne({ user1Id: smallerId, user2Id: largerId });
};
// Static method to get all friends of a user
friendshipSchema.statics.getUserFriends = function (userId) {
    return this.find({
        $or: [{ user1Id: userId }, { user2Id: userId }],
        status: 'active'
    }).populate('user1Id user2Id', 'username email avatar status lastSeen');
};
exports.Friendship = mongoose_1.default.model('Friendship', friendshipSchema);
