import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    thumbnailUrl?: string;
  };
  status: 'sent' | 'delivered' | 'read';
  readBy: mongoose.Types.ObjectId[]; // Liste des utilisateurs qui ont lu le message
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
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
    metadata: {
      fileName: String,
      fileSize: Number,
      fileType: String,
      thumbnailUrl: String,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Compound index for efficient message retrieval in conversations
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Compound index for efficient message status updates
messageSchema.index({ conversationId: 1, status: 1 });

// Text index for message content search
messageSchema.index({ content: 'text' });

// Index for readBy array
messageSchema.index({ readBy: 1 });

// TTL index for message cleanup (optional, if you want to automatically delete old messages)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Static method to get messages for a conversation
messageSchema.statics.getConversationMessages = function(
  conversationId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    skip?: number;
    before?: Date;
  } = {}
) {
  const { limit = 50, skip = 0, before } = options;
  
  const query: any = { conversationId };
  
  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .populate('senderId', 'username avatar')
    .populate('readBy', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to mark message as read by user
messageSchema.statics.markAsRead = function(
  messageId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { readBy: userId },
      status: 'read'
    },
    { new: true }
  );
};

// Static method to mark all messages in conversation as read by user
messageSchema.statics.markConversationAsRead = function(
  conversationId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  return this.updateMany(
    {
      conversationId,
      senderId: { $ne: userId }, // Ne pas marquer ses propres messages comme lus
      readBy: { $ne: userId }
    },
    {
      $addToSet: { readBy: userId },
      status: 'read'
    }
  );
};

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    this.status = 'read';
  }
  return this.save();
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId: mongoose.Types.ObjectId) {
  return this.readBy.some(id => id.toString() === userId.toString());
};

export const Message = mongoose.model<IMessage>('Message', messageSchema); 