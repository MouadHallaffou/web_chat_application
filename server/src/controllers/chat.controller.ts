import { Request, Response, NextFunction } from 'express';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { Friendship } from '../models/friendship.model';
import { User } from '../models/user.model';
import { AppError } from '../middlewares/error-handler';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'messages');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Autoriser images, documents, audio, vidéo
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp3|wav|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new AppError(400, 'Type de fichier non autorisé'));
    }
  }
});

// Récupérer toutes les conversations de l'utilisateur
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)._id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'username avatar status lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Enrichir avec les informations d'ami pour chaque conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        if (conversation.type === 'direct') {
          const friend = conversation.participants.find(
            (p: any) => !p._id.equals(userId)
          ) as any;

          if (friend) {
            // Compter les messages non lus
            const unreadCount = await Message.countDocuments({
              conversationId: conversation._id,
              senderId: { $ne: userId },
              readBy: { $not: { $elemMatch: { userId: userId } } }
            });

            return {
              id: conversation._id,
              type: conversation.type,
              friend: {
                id: friend._id,
                username: friend.username,
                avatar: friend.avatar,
                status: friend.status,
                lastSeen: friend.lastSeen
              },
              lastMessage: conversation.lastMessage,
              unreadCount,
              updatedAt: conversation.updatedAt
            };
          }
        }
        
        return {
          id: conversation._id,
          type: conversation.type,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount?.get(userId.toString()) || 0,
          updatedAt: conversation.updatedAt
        };
      })
    );

    res.json({
      status: 'success',
      data: enrichedConversations
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer ou créer une conversation avec un ami
export const getOrCreateConversation = async (
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

    // Vérifier que l'amitié existe
    const friendship = await Friendship.findOne({
      $or: [
        { user1Id: userId, user2Id: friendId },
        { user2Id: userId, user1Id: friendId }
      ],
      status: 'active'
    });

    if (!friendship) {
      return next(new AppError(403, 'Vous devez être amis pour démarrer une conversation'));
    }

    // Chercher une conversation existante
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [userId, friendId] }
    })
    .populate('participants', 'username avatar status lastSeen')
    .populate('lastMessage');

    // Si aucune conversation n'existe, en créer une
    if (!conversation) {
      conversation = new Conversation({
        type: 'direct',
        participants: [userId, friendId],
        unreadCount: new Map([
          [userId.toString(), 0],
          [friendId.toString(), 0]
        ])
      });
      await conversation.save();
      
      await conversation.populate('participants', 'username avatar status lastSeen');
    }

    const friend = (conversation.participants as any[]).find(
      (p: any) => !p._id.equals(userId)
    );

    res.json({
      status: 'success',
      data: {
        id: conversation._id,
        type: conversation.type,
        friend: {
          id: friend._id,
          username: friend.username,
          avatar: friend.avatar,
          status: friend.status,
          lastSeen: friend.lastSeen
        },
        lastMessage: conversation.lastMessage,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les messages d'une conversation
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(new AppError(400, 'ID de conversation invalide'));
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return next(new AppError(403, 'Accès refusé à cette conversation'));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Inverser l'ordre pour avoir les plus anciens en premier
    messages.reverse();

    res.json({
      status: 'success',
      data: messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        hasMore: messages.length === Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Envoyer un message texte
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId } = req.params;
    const { content, replyToId } = req.body;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(new AppError(400, 'ID de conversation invalide'));
    }

    if (!content || content.trim().length === 0) {
      return next(new AppError(400, 'Le contenu du message ne peut pas être vide'));
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return next(new AppError(403, 'Accès refusé à cette conversation'));
    }

    // Vérifier le message de réponse s'il existe
    let replyTo = null;
    if (replyToId && mongoose.isValidObjectId(replyToId)) {
      replyTo = await Message.findOne({
        _id: replyToId,
        conversationId
      });
    }

    // Créer le message
    const message = new Message({
      conversationId,
      senderId: userId,
      type: 'text',
      content: content.trim(),
      replyTo: replyTo?._id,
      metadata: {
        isEdited: false
      }
    });

    await message.save();
    await message.populate('senderId', 'username avatar');
    if (replyTo) {
      await message.populate('replyTo');
    }

    // Mettre à jour la conversation
    conversation.lastMessage = message._id as any;
    conversation.updatedAt = new Date();

    // Incrémenter le compteur de messages non lus pour les autres participants
    conversation.participants.forEach(participantId => {
      if (!participantId.equals(userId)) {
        const participantIdStr = participantId.toString();
        if (!conversation.unreadCount) conversation.unreadCount = new Map();
        const currentCount = conversation.unreadCount.get(participantIdStr) || 0;
        conversation.unreadCount.set(participantIdStr, currentCount + 1);
      }
    });

    await conversation.save();

    // TODO: Envoyer via Socket.io aux participants
    // socketService.sendToConversation(conversationId, 'new_message', message);

    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// Envoyer un fichier
export const sendFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const uploadSingle = upload.single('file');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      const { conversationId } = req.params;
      const userId = (req.user as any)._id;
      const file = req.file;

      if (!file) {
        return next(new AppError(400, 'Aucun fichier fourni'));
      }

      if (!mongoose.isValidObjectId(conversationId)) {
        return next(new AppError(400, 'ID de conversation invalide'));
      }

      // Vérifier que l'utilisateur fait partie de la conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        return next(new AppError(403, 'Accès refusé à cette conversation'));
      }

      // Déterminer le type de fichier
      let messageType = 'file';
      if (file.mimetype.startsWith('image/')) messageType = 'image';
      else if (file.mimetype.startsWith('audio/')) messageType = 'audio';
      else if (file.mimetype.startsWith('video/')) messageType = 'video';

      // Créer le message
      const message = new Message({
        conversationId,
        senderId: userId,
        type: messageType,
        content: file.originalname,
        metadata: {
          fileName: file.originalname,
          filePath: `/uploads/messages/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          isEdited: false
        }
      });

      await message.save();
      await message.populate('senderId', 'username avatar');

      // Mettre à jour la conversation
      conversation.lastMessage = message._id as any;
      conversation.updatedAt = new Date();

      // Incrémenter les compteurs non lus
      conversation.participants.forEach(participantId => {
        if (!participantId.equals(userId)) {
          const participantIdStr = participantId.toString();
          if (!conversation.unreadCount) conversation.unreadCount = new Map();
          const currentCount = conversation.unreadCount.get(participantIdStr) || 0;
          conversation.unreadCount.set(participantIdStr, currentCount + 1);
        }
      });

      await conversation.save();

      // TODO: Envoyer via Socket.io
      // socketService.sendToConversation(conversationId, 'new_message', message);

      res.status(201).json({
        status: 'success',
        data: message
      });
    });
  } catch (error) {
    next(error);
  }
};

// Marquer les messages comme lus
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId } = req.params;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(new AppError(400, 'ID de conversation invalide'));
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return next(new AppError(403, 'Accès refusé à cette conversation'));
    }

    // Marquer tous les messages non lus comme lus
    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    // Réinitialiser le compteur de messages non lus
    if (conversation.unreadCount) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    res.json({
      status: 'success',
      message: 'Messages marqués comme lus',
      data: { markedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un message
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(messageId)) {
      return next(new AppError(400, 'ID de message invalide'));
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError(404, 'Message non trouvé'));
    }

    if (!message.senderId.equals(userId)) {
      return next(new AppError(403, 'Vous ne pouvez supprimer que vos propres messages'));
    }

    // Si c'est un fichier, le supprimer du système de fichiers
    if (message.metadata?.filePath) {
      const fullPath = path.join(process.cwd(), message.metadata.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Message.findByIdAndDelete(messageId);

    // TODO: Notifier via Socket.io
    // socketService.sendToConversation(message.conversationId, 'message_deleted', { messageId });

    res.json({
      status: 'success',
      message: 'Message supprimé'
    });
  } catch (error) {
    next(error);
  }
};

// Éditer un message
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = (req.user as any)._id;

    if (!mongoose.isValidObjectId(messageId)) {
      return next(new AppError(400, 'ID de message invalide'));
    }

    if (!content || content.trim().length === 0) {
      return next(new AppError(400, 'Le contenu ne peut pas être vide'));
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError(404, 'Message non trouvé'));
    }

    if (!message.senderId.equals(userId)) {
      return next(new AppError(403, 'Vous ne pouvez éditer que vos propres messages'));
    }

    if (message.type !== 'text') {
      return next(new AppError(400, 'Vous ne pouvez éditer que les messages texte'));
    }

    message.content = content.trim();
    message.metadata = {
      ...message.metadata,
      isEdited: true,
      editedAt: new Date()
    };

    await message.save();

    // TODO: Notifier via Socket.io
    // socketService.sendToConversation(message.conversationId, 'message_edited', message);

    res.json({
      status: 'success',
      data: message
    });
  } catch (error) {
    next(error);
  }
};
