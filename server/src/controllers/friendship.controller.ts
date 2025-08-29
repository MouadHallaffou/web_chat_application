import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { FriendInvitation } from '../models/friend-invitation.model';
import { Friendship } from '../models/friendship.model';
import { AppError } from '../middlewares/error-handler';
import mongoose from 'mongoose';

// Rechercher des utilisateurs par nom d'utilisateur
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Search users endpoint called');
    console.log('📋 Query params:', req.query);
    console.log('👤 User:', req.user);
    
    const { query } = req.query;
    const userId = (req.user as any)._id;

    console.log('🔍 Search query:', query);
    console.log('👤 User ID:', userId);

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      console.log('❌ Query too short or missing');
      return res.json({
        status: 'success',
        data: []
      });
    }

    // Rechercher les utilisateurs correspondants (excluant l'utilisateur connecté)
    console.log('🔍 Searching users with query:', query.trim());
    const users = await User.find({
      _id: { $ne: userId },
      username: { $regex: query.trim(), $options: 'i' }
    })
    .select('username email avatar status lastSeen')
    .limit(10);

    console.log('👥 Found users:', users.length);
    console.log('👥 Users data:', users);

    // Récupérer les invitations existantes
    const existingInvitations = await FriendInvitation.find({
      $or: [
        { senderId: userId, receiverId: { $in: users.map(u => u._id) } },
        { receiverId: userId, senderId: { $in: users.map(u => u._id) } }
      ]
    });

    // Récupérer les amitiés existantes
    const existingFriendships = await Friendship.find({
      $or: [
        { user1Id: userId, user2Id: { $in: users.map(u => u._id) } },
        { user2Id: userId, user1Id: { $in: users.map(u => u._id) } }
      ]
    });

    // Enrichir les résultats avec le statut de la relation
    const enrichedUsers = users.map(user => {
      const invitation = existingInvitations.find(inv => 
        (inv.senderId.equals(userId) && inv.receiverId.equals(user._id)) ||
        (inv.receiverId.equals(userId) && inv.senderId.equals(user._id))
      );

      const friendship = existingFriendships.find(f => 
        (f.user1Id.equals(userId) && f.user2Id.equals(user._id)) ||
        (f.user2Id.equals(userId) && f.user1Id.equals(user._id))
      );

      let relationshipStatus = 'none';
      if (friendship) {
        relationshipStatus = friendship.status; // 'active' ou 'blocked'
      } else if (invitation) {
        if (invitation.senderId.equals(userId)) {
          relationshipStatus = `sent_${invitation.status}`; // sent_pending, sent_rejected, etc.
        } else {
          relationshipStatus = `received_${invitation.status}`; // received_pending, etc.
        }
      }

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        relationshipStatus
      };
    });

    res.json({
      status: 'success',
      data: enrichedUsers
    });
  } catch (error) {
    next(error);
  }
};

// Envoyer une invitation d'amitié
export const sendFriendInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = (req.user as any)._id;

    if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
      return next(new AppError(400, 'ID du destinataire invalide'));
    }

    if (senderId.equals(receiverId)) {
      return next(new AppError(400, 'Vous ne pouvez pas vous envoyer une invitation à vous-même'));
    }

    // Vérifier que le destinataire existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(new AppError(404, 'Utilisateur non trouvé'));
    }

    // Vérifier s'il n'y a pas déjà une amitié
    const existingFriendship = await Friendship.findOne({
      $or: [
        { user1Id: senderId, user2Id: receiverId },
        { user2Id: senderId, user1Id: receiverId }
      ]
    });

    if (existingFriendship) {
      return next(new AppError(400, 'Vous êtes déjà amis ou la relation est bloquée'));
    }

    // Vérifier s'il n'y a pas déjà une invitation en cours
    const existingInvitation = await FriendInvitation.findOne({
      $or: [
        { senderId, receiverId, status: 'pending' },
        { senderId: receiverId, receiverId: senderId, status: 'pending' }
      ]
    });

    if (existingInvitation) {
      return next(new AppError(400, 'Une invitation est déjà en cours'));
    }

    // Créer la nouvelle invitation
    const invitation = new FriendInvitation({
      senderId,
      receiverId,
      message: message?.trim() || undefined,
      status: 'pending'
    });

    await invitation.save();

    // Peupler les données pour la réponse
    await invitation.populate('senderId', 'username avatar');
    await invitation.populate('receiverId', 'username avatar');

    // TODO: Envoyer une notification temps réel au destinataire
    // socketService.sendToUser(receiverId, 'friend_invitation', invitation);

    res.status(201).json({
      status: 'success',
      message: 'Invitation d\'amitié envoyée',
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les invitations reçues
export const getReceivedInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)._id;

    const invitations = await FriendInvitation.find({
      receiverId: userId,
      status: 'pending'
    })
    .populate('senderId', 'username email avatar status lastSeen')
    .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les invitations envoyées
export const getSentInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)._id;

    const invitations = await FriendInvitation.find({
      senderId: userId,
      status: 'pending'
    })
    .populate('receiverId', 'username email avatar status lastSeen')
    .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

// Répondre à une invitation (accepter/refuser)
export const respondToInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' ou 'reject'
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(invitationId)) {
      return next(new AppError(400, 'ID d\'invitation invalide'));
    }

    if (!['accept', 'reject'].includes(action)) {
      return next(new AppError(400, 'Action invalide. Utilisez "accept" ou "reject"'));
    }

    const invitation = await FriendInvitation.findById(invitationId);
    if (!invitation) {
      return next(new AppError(404, 'Invitation non trouvée'));
    }

    if (!invitation.receiverId.equals(userId)) {
      return next(new AppError(403, 'Vous ne pouvez répondre qu\'aux invitations qui vous sont adressées'));
    }

    if (invitation.status !== 'pending') {
      return next(new AppError(400, 'Cette invitation a déjà été traitée'));
    }

    // Démarrer une transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (action === 'accept') {
        // Accepter l'invitation
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        await invitation.save({ session });

        // Créer l'amitié
        const friendship = new Friendship({
          user1Id: invitation.senderId,
          user2Id: invitation.receiverId,
          status: 'active',
          lastInteractionAt: new Date()
        });
        await friendship.save({ session });

        await session.commitTransaction();

        // TODO: Notifier l'expéditeur
        // socketService.sendToUser(invitation.senderId, 'friend_accepted', { userId, username: req.user.username });

        res.json({
          status: 'success',
          message: 'Invitation acceptée',
          data: { friendship }
        });
      } else {
        // Refuser l'invitation
        invitation.status = 'rejected';
        invitation.rejectedAt = new Date();
        await invitation.save({ session });

        await session.commitTransaction();

        res.json({
          status: 'success',
          message: 'Invitation refusée'
        });
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// Annuler une invitation envoyée
export const cancelInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invitationId } = req.params;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(invitationId)) {
      return next(new AppError(400, 'ID d\'invitation invalide'));
    }

    const invitation = await FriendInvitation.findById(invitationId);
    if (!invitation) {
      return next(new AppError(404, 'Invitation non trouvée'));
    }

    if (!invitation.senderId.equals(userId)) {
      return next(new AppError(403, 'Vous ne pouvez annuler que vos propres invitations'));
    }

    if (invitation.status !== 'pending') {
      return next(new AppError(400, 'Cette invitation ne peut plus être annulée'));
    }

    invitation.status = 'cancelled';
    await invitation.save();

    res.json({
      status: 'success',
      message: 'Invitation annulée'
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer la liste des amis
export const getFriends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)._id;

    const friendships = await Friendship.find({
      $or: [
        { user1Id: userId, status: 'active' },
        { user2Id: userId, status: 'active' }
      ]
    })
    .populate('user1Id', 'username email avatar status lastSeen')
    .populate('user2Id', 'username email avatar status lastSeen')
    .sort({ lastInteractionAt: -1 });

    const friends = friendships.map(friendship => {
      const friend = (friendship.user1Id as any)._id.equals(userId) 
        ? friendship.user2Id as any
        : friendship.user1Id as any;
      
      return {
        id: friend._id,
        username: friend.username,
        email: friend.email,
        avatar: friend.avatar,
        status: friend.status,
        lastSeen: friend.lastSeen,
        friendshipId: friendship._id,
        lastInteractionAt: friendship.lastInteractionAt
      };
    });

    res.json({
      status: 'success',
      data: friends
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un ami
export const removeFriend = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(friendId)) {
      return next(new AppError(400, 'ID d\'ami invalide'));
    }

    const friendship = await Friendship.findOne({
      $or: [
        { user1Id: userId, user2Id: friendId },
        { user2Id: userId, user1Id: friendId }
      ]
    });

    if (!friendship) {
      return next(new AppError(404, 'Amitié non trouvée'));
    }

    await Friendship.findByIdAndDelete(friendship._id);

    res.json({
      status: 'success',
      message: 'Ami supprimé'
    });
  } catch (error) {
    next(error);
  }
};
