import { create } from 'zustand';
import { ChatState, Conversation, Message, SendMessagePayload } from './types';

interface ChatStore extends ChatState {
  setCurrentConversation: (conversation: Conversation) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

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
      // TODO: Implement WebSocket or API call
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const message = await response.json();
      get().addMessage(message);
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
      // TODO: Implement API call
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');

      const messages = await response.json();
      set({ messages, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
})); 