import express from 'express';
import { authenticate } from '../middlewares/auth';
import { Friendship } from '../models/friendship.model';
import { User } from '../models/user.model';
import { Conversation } from '../models/conversation.model';
import mongoose from 'mongoose';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Récupérer la liste d'amis de l'utilisateur connecté
router.get('/friends', async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer toutes les amitiés actives de l'utilisateur
    const friendships = await Friendship.find({
      $or: [
        { requesterId: userId, status: 'active' },
        { recipientId: userId, status: 'active' }
      ]
    }).populate('requesterId', 'username email avatar status lastSeen')
      .populate('recipientId', 'username email avatar status lastSeen');

    // Transformer les données pour avoir la liste d'amis
    const friends = friendships.map(friendship => {
      const friend = friendship.requesterId._id.equals(userId) 
        ? friendship.recipientId 
        : friendship.requesterId;
      
      return {
        id: friend._id,
        username: friend.username,
        email: friend.email,
        avatar: friend.avatar,
        status: friend.status,
        lastSeen: friend.lastSeen,
        friendshipId: friendship._id
      };
    });

    res.json({
      status: 'success',
      data: friends
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch friends'
    });
  }
});

// Récupérer les conversations de l'utilisateur connecté
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    }).populate('participants', 'username email avatar status lastSeen')
      .populate('lastMessage.senderId', 'username')
      .sort({ 'lastMessage.timestamp': -1 });

    // Transformer les données pour avoir les conversations avec les amis
    const conversationsWithFriends = conversations.map(conversation => {
      const friend = conversation.participants.find(p => !p._id.equals(userId));
      
      return {
        id: conversation._id,
        friend: {
          id: friend._id,
          username: friend.username,
          email: friend.email,
          avatar: friend.avatar,
          status: friend.status,
          lastSeen: friend.lastSeen
        },
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
        updatedAt: conversation.updatedAt
      };
    });

    res.json({
      status: 'success',
      data: conversationsWithFriends
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations'
    });
  }
});

// Envoyer une demande d'amitié
router.post('/friends/request', async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid recipient ID'
      });
    }

    // Vérifier si l'amitié existe déjà
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({
        status: 'error',
        message: 'Friendship request already exists'
      });
    }

    // Créer la demande d'amitié
    const friendship = new Friendship({
      requesterId,
      recipientId,
      status: 'pending'
    });

    await friendship.save();

    res.status(201).json({
      status: 'success',
      data: friendship
    });
  } catch (error) {
    console.error('Error creating friendship request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create friendship request'
    });
  }
});

// Accepter/Refuser une demande d'amitié
router.put('/friends/:friendshipId/respond', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { status } = req.body; // 'accepted' ou 'rejected'
    const userId = req.user._id;

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        status: 'error',
        message: 'Friendship request not found'
      });
    }

    if (!friendship.recipientId.equals(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to respond to this request'
      });
    }

    friendship.status = status;
    await friendship.save();

    res.json({
      status: 'success',
      data: friendship
    });
  } catch (error) {
    console.error('Error responding to friendship request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to respond to friendship request'
    });
  }
});

export default router; 