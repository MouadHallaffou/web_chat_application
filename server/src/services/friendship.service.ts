import { User, Friendship, FriendInvitation, Notification } from '../models';
import mongoose from 'mongoose';

export class FriendshipService {
  // Rechercher des utilisateurs par nom d'utilisateur
  static async searchUsers(query: string, currentUserId: mongoose.Types.ObjectId, limit: number = 10) {
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: currentUserId } } // Exclure l'utilisateur actuel
      ]
    })
    .select('username email avatar status lastSeen')
    .limit(limit);

    // Vérifier le statut d'amitié pour chaque utilisateur
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friendship.findFriendship(currentUserId, user._id);
        const invitation = await FriendInvitation.findOne({
          $or: [
            { senderId: currentUserId, receiverId: user._id },
            { senderId: user._id, receiverId: currentUserId }
          ]
        });

        return {
          ...user.toObject(),
          friendshipStatus: friendship ? friendship.status : null,
          invitationStatus: invitation ? invitation.status : null
        };
      })
    );

    return usersWithStatus;
  }

  // Envoyer une invitation d'amis
  static async sendFriendInvitation(
    senderId: mongoose.Types.ObjectId,
    receiverId: mongoose.Types.ObjectId,
    message?: string
  ) {
    // Vérifier si les utilisateurs existent
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si une amitié existe déjà
    const existingFriendship = await Friendship.findFriendship(senderId, receiverId);
    if (existingFriendship) {
      throw new Error('Vous êtes déjà amis avec cet utilisateur');
    }

    // Vérifier si une invitation existe déjà
    const existingInvitation = await FriendInvitation.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingInvitation) {
      throw new Error('Une invitation existe déjà entre ces utilisateurs');
    }

    // Créer l'invitation
    const invitation = new FriendInvitation({
      senderId,
      receiverId,
      message
    });

    await invitation.save();

    // Créer une notification
    await Notification.createNotification({
      recipientId: receiverId,
      senderId,
      type: 'friend_request',
      title: 'Nouvelle demande d\'ami',
      message: `${sender.username} vous a envoyé une demande d'ami`,
      data: { invitationId: invitation._id }
    });

    return invitation;
  }

  // Accepter une invitation d'amis
  static async acceptFriendInvitation(
    invitationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ) {
    const invitation = await FriendInvitation.findById(invitationId);
    
    if (!invitation) {
      throw new Error('Invitation non trouvée');
    }

    if (invitation.receiverId.toString() !== userId.toString()) {
      throw new Error('Vous n\'êtes pas autorisé à accepter cette invitation');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Cette invitation n\'est plus valide');
    }

    // Mettre à jour l'invitation
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Créer la relation d'amis
    const friendship = new Friendship({
      user1Id: invitation.senderId,
      user2Id: invitation.receiverId,
      status: 'active'
    });

    await friendship.save();

    // Créer une notification pour l'expéditeur
    await Notification.createNotification({
      recipientId: invitation.senderId,
      senderId: invitation.receiverId,
      type: 'friend_accepted',
      title: 'Demande d\'ami acceptée',
      message: `${invitation.receiverId} a accepté votre demande d'ami`,
      data: { invitationId: invitation._id }
    });

    return { invitation, friendship };
  }

  // Rejeter une invitation d'amis
  static async rejectFriendInvitation(
    invitationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ) {
    const invitation = await FriendInvitation.findById(invitationId);
    
    if (!invitation) {
      throw new Error('Invitation non trouvée');
    }

    if (invitation.receiverId.toString() !== userId.toString()) {
      throw new Error('Vous n\'êtes pas autorisé à rejeter cette invitation');
    }

    invitation.status = 'rejected';
    invitation.rejectedAt = new Date();
    await invitation.save();

    return invitation;
  }

  // Annuler une invitation d'amis
  static async cancelFriendInvitation(
    invitationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ) {
    const invitation = await FriendInvitation.findById(invitationId);
    
    if (!invitation) {
      throw new Error('Invitation non trouvée');
    }

    if (invitation.senderId.toString() !== userId.toString()) {
      throw new Error('Vous n\'êtes pas autorisé à annuler cette invitation');
    }

    invitation.status = 'cancelled';
    await invitation.save();

    return invitation;
  }

  // Obtenir la liste des amis d'un utilisateur
  static async getUserFriends(userId: mongoose.Types.ObjectId) {
    const friendships = await Friendship.getUserFriends(userId);
    
    return friendships.map((friendship: any) => {
      const friend = friendship.user1Id.toString() === userId.toString() 
        ? friendship.user2Id 
        : friendship.user1Id;
      
      return {
        ...(friend.toObject ? friend.toObject() : friend),
        friendshipId: friendship._id,
        lastInteractionAt: friendship.lastInteractionAt
      };
    });
  }

  // Obtenir les invitations envoyées par un utilisateur
  static async getSentInvitations(userId: mongoose.Types.ObjectId) {
    return FriendInvitation.find({
      senderId: userId,
      status: 'pending'
    }).populate('receiverId', 'username email avatar');
  }

  // Obtenir les invitations reçues par un utilisateur
  static async getReceivedInvitations(userId: mongoose.Types.ObjectId) {
    return FriendInvitation.find({
      receiverId: userId,
      status: 'pending'
    }).populate('senderId', 'username email avatar');
  }

  // Supprimer un ami
  static async removeFriend(
    userId: mongoose.Types.ObjectId,
    friendId: mongoose.Types.ObjectId
  ) {
    const friendship = await Friendship.findFriendship(userId, friendId);
    
    if (!friendship) {
      throw new Error('Relation d\'amitié non trouvée');
    }

    await friendship.deleteOne();
    return { success: true };
  }

  // Bloquer un utilisateur
  static async blockUser(
    userId: mongoose.Types.ObjectId,
    userToBlockId: mongoose.Types.ObjectId
  ) {
    let friendship = await Friendship.findFriendship(userId, userToBlockId);
    
    if (!friendship) {
      // Créer une relation bloquée
      friendship = new Friendship({
        user1Id: userId,
        user2Id: userToBlockId,
        status: 'blocked',
        blockedBy: userId
      });
    } else {
      friendship.status = 'blocked';
      friendship.blockedBy = userId;
    }

    await friendship.save();
    return friendship;
  }

  // Débloquer un utilisateur
  static async unblockUser(
    userId: mongoose.Types.ObjectId,
    userToUnblockId: mongoose.Types.ObjectId
  ) {
    const friendship = await Friendship.findFriendship(userId, userToUnblockId);
    
    if (!friendship || friendship.status !== 'blocked') {
      throw new Error('Utilisateur non bloqué');
    }

    if (friendship.blockedBy?.toString() !== userId.toString()) {
      throw new Error('Vous n\'avez pas bloqué cet utilisateur');
    }

    await friendship.deleteOne();
    return { success: true };
  }
} 