import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'system' | 'mention';
  title: string;
  message: string;
  data?: {
    conversationId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    invitationId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  isRead: boolean;
  isDeleted: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
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
      conversationId: Schema.Types.ObjectId,
      messageId: Schema.Types.ObjectId,
      invitationId: Schema.Types.ObjectId,
      // Permet des données supplémentaires flexibles
      type: Schema.Types.Mixed
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
  },
  {
    timestamps: true
  }
);

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, isDeleted: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = function(data: {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: INotification['type'];
  title: string;
  message: string;
  data?: any;
}) {
  return new this(data).save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(
  userId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  } = {}
) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;
  
  const query: any = {
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
notificationSchema.statics.markAsRead = function(
  userId: mongoose.Types.ObjectId,
  notificationIds?: mongoose.Types.ObjectId[]
) {
  const query: any = {
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
notificationSchema.statics.deleteNotifications = function(
  userId: mongoose.Types.ObjectId,
  notificationIds: mongoose.Types.ObjectId[]
) {
  return this.updateMany(
    {
      recipientId: userId,
      _id: { $in: notificationIds }
    },
    {
      isDeleted: true
    }
  );
};

// Method to mark single notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 