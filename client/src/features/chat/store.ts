/*
 * Fichier : client/src/features/chat/store.ts
 * Rôle : Store Zustand pour la gestion de l'état du chat (messages, conversations, amis).
 * - Gère les messages, conversations, amis, et l'état de chargement/erreur.
 * - Fournit des méthodes pour envoyer/recevoir des messages, charger les conversations et amis.
 * - Initialise les listeners WebSocket pour la synchronisation temps réel.
 * Dépendances :
 * - Zustand : gestion d'état globale.
 * - messageService, friendshipService : services API pour le chat.
 * - socketService : gestion des événements WebSocket.
 */
import { create } from 'zustand';
import { ChatState, Conversation, Message, SendMessagePayload } from './types';
import { messageService } from '@/services/message.service';
import { socketService } from '@/services/socket.service';
import { friendshipService, Friend, Conversation as FriendshipConversation } from '@/services/friendship.service';

interface ChatStore extends ChatState {
  setCurrentConversation: (conversation: Conversation) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  initializeSocketListeners: () => void;
  loadFriends: () => Promise<void>;
  friends: Friend[];
  friendshipConversations: FriendshipConversation[];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  friends: [],
  friendshipConversations: [],

  // Initialiser les listeners WebSocket
  initializeSocketListeners: () => {
    // Écouter les nouveaux messages
    socketService.onNewMessage((message) => {
      get().addMessage(message);
    });

    // Écouter les mises à jour de statut
    socketService.onMessageStatusUpdate(({ messageId, status }) => {
      get().updateMessageStatus(messageId, status as 'sent' | 'delivered' | 'read');
    });

    // Écouter les suppressions de messages
    socketService.onMessageDeleted(({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter(msg => msg.id !== messageId)
      }));
    });
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      conversations: state.conversations.map((conv) =>
        conv.id === message.receiverId
          ? {
              ...conv,
              lastMessage: message,
              unreadCount: conv.unreadCount + 1,
            }
          : conv
      ),
    }));
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    }));
  },

  sendMessage: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      
      // Envoyer le message via l'API
      const response = await messageService.sendMessage(payload);
      const message = response.data;
      
      // Ajouter le message au store
      get().addMessage(message);
      
      // Émettre l'événement WebSocket pour la synchronisation temps réel
      socketService.emitMessage(payload);
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      // TODO: Implement API call
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');

      const conversations = await response.json();
      set({ conversations, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadMessages: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Charger les messages via l'API
      const response = await messageService.getMessages(conversationId);
      const messages = response.data.messages;
      
      set({ messages, isLoading: false });
      
      // Rejoindre la conversation via WebSocket
      socketService.emitJoinConversation(conversationId);
      
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadFriends: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Charger les amis via l'API
      const friendsResponse = await friendshipService.getFriends();
      const conversationsResponse = await friendshipService.getConversations();
      
      set({ 
        friends: friendsResponse.data,
        friendshipConversations: conversationsResponse.data,
        isLoading: false 
      });
      
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
})); 