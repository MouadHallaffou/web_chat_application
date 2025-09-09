import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IFriendship extends Document {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;
  status: 'active' | 'blocked';
  blockedBy?: mongoose.Types.ObjectId; // Qui a bloqué l'autre
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt: Date; // Dernière interaction entre les amis
}

interface IFriendshipModel extends Model<IFriendship> {
  findFriendship(user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId): Promise<IFriendship | null>;
  getUserFriends(userId: mongoose.Types.ObjectId): Promise<IFriendship[]>;
}

const friendshipSchema = new Schema<IFriendship, IFriendshipModel>(
  {
    user1Id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    user2Id: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
friendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
friendshipSchema.index({ user1Id: 1, status: 1 });
friendshipSchema.index({ user2Id: 1, status: 1 });
friendshipSchema.index({ status: 1, lastInteractionAt: -1 });

// Ensure user1Id is always the smaller ObjectId for consistency
friendshipSchema.pre('save', function(next) {
  if (this.user1Id.toString() > this.user2Id.toString()) {
    [this.user1Id, this.user2Id] = [this.user2Id, this.user1Id];
  }
  next();
});

// Static method to find friendship between two users
friendshipSchema.statics.findFriendship = function(user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId) {
  const [smallerId, largerId] = user1Id.toString() < user2Id.toString() ? [user1Id, user2Id] : [user2Id, user1Id];
  return this.findOne({ user1Id: smallerId, user2Id: largerId });
};

// Static method to get all friends of a user
friendshipSchema.statics.getUserFriends = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    status: 'active'
  }).populate('user1Id user2Id', 'username email avatar status lastSeen');
};

export const Friendship = mongoose.model<IFriendship, IFriendshipModel>('Friendship', friendshipSchema);