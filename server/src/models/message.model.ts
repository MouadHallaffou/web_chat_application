import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  replyTo?: mongoose.Types.ObjectId;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    filePath?: string;
    mimeType?: string;
    thumbnailUrl?: string;
    isEdited?: boolean;
    editedAt?: Date;
  };
  status: 'sent' | 'delivered' | 'read';
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  isReadBy(userId: mongoose.Types.ObjectId): boolean;
  markAsReadBy(userId: mongoose.Types.ObjectId): void;
  markAsRead(userId: mongoose.Types.ObjectId): Promise<IMessage>;
}

interface IMessageModel extends Model<IMessage> {
  markConversationAsRead(conversationId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<any>;
  getConversationMessages(conversationId: mongoose.Types.ObjectId, options?: { limit?: number; skip?: number; before?: Date }): Promise<IMessage[]>;
}

const messageSchema = new Schema<IMessage, IMessageModel>(
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
    replyTo: {
      type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      readAt: {
        type: Date,
        required: true
      }
    }]
  },
  {
    timestamps: true
  }
);

// Index pour améliorer les performances de recherche
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

// Méthode pour vérifier si un message a été lu par un utilisateur
messageSchema.methods.isReadBy = function(userId: mongoose.Types.ObjectId): boolean {
  return this.readBy.some((readEntry: any) => readEntry.userId.toString() === userId.toString());
};

// Méthode pour marquer comme lu par un utilisateur
messageSchema.methods.markAsReadBy = function(this: IMessage, userId: mongoose.Types.ObjectId): void {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
};

messageSchema.methods.markAsRead = function(this: IMessage, userId: mongoose.Types.ObjectId) {
  if (!this.readBy.some((entry: any) => entry.userId.toString() === userId.toString())) {
    this.readBy.push({ userId, readAt: new Date() });
  }
  if (this.readBy.length > 0) {
    this.status = 'read';
  }
  return this.save();
};

// Virtuel pour obtenir le nombre total de lectures
messageSchema.virtual('readCount').get(function() {
  return this.readBy.length;
});

// Middleware pour mettre à jour le status automatiquement
messageSchema.pre('save', function(next) {
  if (this.readBy.length > 0) {
    this.status = 'read';
  }
  next();
});

messageSchema.statics.markConversationAsRead = function(this: IMessageModel, conversationId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    { conversationId, senderId: { $ne: userId }, 'readBy.userId': { $ne: userId } },
    {
      $push: { readBy: { userId, readAt: new Date() } },
      $set: { status: 'read' }
    }
  );
};

messageSchema.statics.getConversationMessages = function(this: IMessageModel, conversationId: mongoose.Types.ObjectId, options: { limit?: number; skip?: number; before?: Date } = {}) {
  const { limit = 50, skip = 0, before } = options;
  const query: any = { conversationId };
  if (before) query.createdAt = { $lt: before };
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const Message = mongoose.model<IMessage, IMessageModel>('Message', messageSchema);
