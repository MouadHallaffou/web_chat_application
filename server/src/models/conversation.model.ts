import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'direct' | 'group';
  name?: string; // Pour les conversations de groupe
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  unreadCount: Map<string, number>; // userId -> nombre de messages non lus
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  markAsRead(userId: mongoose.Types.ObjectId): Promise<IConversation>;
  incrementUnreadCount(userId: mongoose.Types.ObjectId): Promise<IConversation>;
}

interface IConversationModel extends Model<IConversation> {
  findOrCreateDirectConversation(user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId): Promise<IConversation>;
  getUserConversations(userId: mongoose.Types.ObjectId): Promise<IConversation[]>;
}

const conversationSchema = new Schema<IConversation, IConversationModel>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true
  }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });
conversationSchema.index({ isActive: 1 });

// Ensure participants are unique and sorted
conversationSchema.pre('save', function(next) {
  if (this.participants) {
    this.participants = [...new Set(this.participants)].sort();
  }
  next();
});

// Static method to find or create direct conversation between two users
conversationSchema.statics.findOrCreateDirectConversation = async function(this: IConversationModel, user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId) {
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
conversationSchema.statics.getUserConversations = function(this: IConversationModel, userId: mongoose.Types.ObjectId) {
  return this.find({
    participants: userId,
    isActive: true
  })
  .populate('participants', 'username email avatar status lastSeen')
  .populate('lastMessage.senderId', 'username')
  .sort({ 'lastMessage.timestamp': -1 });
};

// Method to mark messages as read for a user
conversationSchema.methods.markAsRead = function(this: IConversation, userId: mongoose.Types.ObjectId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function(this: IConversation, userId: mongoose.Types.ObjectId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

export const Conversation = mongoose.model<IConversation, IConversationModel>('Conversation', conversationSchema);