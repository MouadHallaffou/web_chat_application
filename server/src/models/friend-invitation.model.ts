import mongoose, { Document, Schema } from 'mongoose';

export interface IFriendInvitation extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string; // Message optionnel avec l'invitation
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

const friendInvitationSchema = new Schema<IFriendInvitation>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
friendInvitationSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
friendInvitationSchema.index({ receiverId: 1, status: 1 });
friendInvitationSchema.index({ senderId: 1, status: 1 });
friendInvitationSchema.index({ status: 1, createdAt: -1 });

// Prevent duplicate invitations
friendInvitationSchema.pre('save', async function(next) {
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

export const FriendInvitation = mongoose.model<IFriendInvitation>('FriendInvitation', friendInvitationSchema); 