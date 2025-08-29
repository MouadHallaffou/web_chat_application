import mongoose, { Document, Schema } from 'mongoose';

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
messageSchema.methods.markAsReadBy = function(userId: mongoose.Types.ObjectId): void {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
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

export const Message = mongoose.model<IMessage>('Message', messageSchema);
