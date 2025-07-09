import api from './api';

export interface Friend {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  friendshipId: string;
}

export interface Conversation {
  id: string;
  friend: Friend;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface FriendsResponse {
  status: string;
  data: Friend[];
}

export interface ConversationsResponse {
  status: string;
  data: Conversation[];
}

export const friendshipService = {
  // Récupérer la liste d'amis
  async getFriends(): Promise<FriendsResponse> {
    const response = await api.get('/friends');
    return response.data;
  },

  // Récupérer les conversations
  async getConversations(): Promise<ConversationsResponse> {
    const response = await api.get('/conversations');
    return response.data;
  },

  // Envoyer une demande d'amitié
  async sendFriendRequest(recipientId: string): Promise<any> {
    const response = await api.post('/friends/request', { recipientId });
    return response.data;
  },

  // Répondre à une demande d'amitié
  async respondToFriendRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<any> {
    const response = await api.put(`/friends/${friendshipId}/respond`, { status });
    return response.data;
  }
}; 