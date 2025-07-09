import api from './api';
import { Message, SendMessagePayload } from '@/features/chat/types';

export interface GetMessagesResponse {
  status: string;
  data: {
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SendMessageResponse {
  status: string;
  data: Message;
}

export interface UpdateMessageStatusResponse {
  status: string;
  data: Message;
}

export const messageService = {
  // Récupérer les messages d'une conversation
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<GetMessagesResponse> {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Envoyer un nouveau message
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    const response = await api.post('/messages', payload);
    return response.data;
  },

  // Mettre à jour le statut d'un message
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<UpdateMessageStatusResponse> {
    const response = await api.put(`/messages/${messageId}/status`, { status });
    return response.data;
  },

  // Supprimer un message
  async deleteMessage(messageId: string): Promise<{ status: string; message: string }> {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Marquer tous les messages d'une conversation comme lus
  async markConversationAsRead(conversationId: string): Promise<void> {
    // Cette fonction sera implémentée plus tard si nécessaire
    console.log('Marking conversation as read:', conversationId);
  }
}; 