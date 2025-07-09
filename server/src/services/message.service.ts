import { User, Message, Conversation, Friendship, Notification } from '../models';
import mongoose from 'mongoose';

export class MessageService {
  // Envoyer un message
  static async sendMessage(
    senderId: mongoose.Types.ObjectId,
    receiverId: mongoose.Types.ObjectId,
    content: string,
    type: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text',
    metadata?: any
  ) {
    // Vérifier si les utilisateurs existent
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si les utilisateurs sont amis
    const friendship = await Friendship.findFriendship(senderId, receiverId);
    const areFriends = friendship && friendship.status === 'active';

    // Créer ou trouver la conversation
    let conversation = await Conversation.findOrCreateDirectConversation(senderId, receiverId);

    // Créer le message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      content,
      type,
      metadata,
      status: 'sent'
    });

    await message.save();

    // Mettre à jour la conversation avec le dernier message
    conversation.lastMessage = {
      content,
      senderId,
      timestamp: new Date()
    };

    // Incrémenter le compteur de messages non lus pour le destinataire
    if (areFriends) {
      await conversation.incrementUnreadCount(receiverId);
    }

    await conversation.save();

    // Créer une notification si les utilisateurs ne sont pas amis
    if (!areFriends) {
      await Notification.createNotification({
        recipientId: receiverId,
        senderId,
        type: 'message',
        title: 'Nouveau message',
        message: `${sender.username} vous a envoyé un message`,
        data: { 
          conversationId: conversation._id,
          messageId: message._id
        }
      });
    }

    // Populate les données du message pour le retour
    await message.populate('senderId', 'username avatar');

    return {
      message,
      conversation,
      areFriends
    };
  }

  // Obtenir les messages d'une conversation
  static async getConversationMessages(
    conversationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    options: {
      limit?: number;
      skip?: number;
      before?: Date;
    } = {}
  ) {
    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Conversation non trouvée ou accès non autorisé');
    }

    // Marquer les messages comme lus
    await Message.markConversationAsRead(conversationId, userId);
    await conversation.markAsRead(userId);

    // Obtenir les messages
    const messages = await Message.getConversationMessages(conversationId, options);

    return messages;
  }

  // Obtenir les conversations d'un utilisateur
  static async getUserConversations(userId: mongoose.Types.ObjectId) {
    const conversations = await Conversation.getUserConversations(userId);
    
    // Pour chaque conversation, obtenir le nombre de messages non lus
    const conversationsWithUnreadCount = conversations.map(conversation => {
      const unreadCount = conversation.unreadCount.get(userId.toString()) || 0;
      return {
        ...conversation.toObject(),
        unreadCount
      };
    });

    return conversationsWithUnreadCount;
  }

  // Marquer un message comme lu
  static async markMessageAsRead(
    messageId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message non trouvé');
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Accès non autorisé');
    }

    await message.markAsRead(userId);
    return message;
  }

  // Supprimer un message
  static async deleteMessage(
    messageId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message non trouvé');
    }

    // Seul l'expéditeur peut supprimer son message
    if (message.senderId.toString() !== userId.toString()) {
      throw new Error('Vous ne pouvez supprimer que vos propres messages');
    }

    await message.deleteOne();
    return { success: true };
  }

  // Rechercher des messages
  static async searchMessages(
    userId: mongoose.Types.ObjectId,
    query: string,
    options: {
      limit?: number;
      skip?: number;
    } = {}
  ) {
    const { limit = 20, skip = 0 } = options;

    // Obtenir les conversations de l'utilisateur
    const conversations = await Conversation.find({
      participants: userId
    });

    const conversationIds = conversations.map(c => c._id);

    // Rechercher dans les messages
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      content: { $regex: query, $options: 'i' }
    })
    .populate('senderId', 'username avatar')
    .populate('conversationId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    return messages;
  }

  // Obtenir les statistiques des messages
  static async getMessageStats(userId: mongoose.Types.ObjectId) {
    const conversations = await Conversation.find({
      participants: userId
    });

    const conversationIds = conversations.map(c => c._id);

    const [
      totalMessages,
      unreadMessages,
      todayMessages
    ] = await Promise.all([
      Message.countDocuments({ conversationId: { $in: conversationIds } }),
      Message.countDocuments({
        conversationId: { $in: conversationIds },
        senderId: { $ne: userId },
        readBy: { $ne: userId }
      }),
      Message.countDocuments({
        conversationId: { $in: conversationIds },
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    return {
      totalMessages,
      unreadMessages,
      todayMessages,
      totalConversations: conversations.length
    };
  }

  // Obtenir les messages non lus d'un utilisateur
  static async getUnreadMessages(userId: mongoose.Types.ObjectId) {
    const conversations = await Conversation.find({
      participants: userId
    });

    const conversationIds = conversations.map(c => c._id);

    const unreadMessages = await Message.find({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      readBy: { $ne: userId }
    })
    .populate('senderId', 'username avatar')
    .populate('conversationId')
    .sort({ createdAt: -1 });

    return unreadMessages;
  }
} 