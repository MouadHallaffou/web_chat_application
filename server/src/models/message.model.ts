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
    }
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

// TTL index for message cleanup (optional, if you want to automatically delete old messages)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

export const Message = mongoose.model<IMessage>('Message', messageSchema); 