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

export interface FriendInvitation {
  _id: string;
  senderId: Friend;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendInvitationsResponse {
  status: string;
  data: FriendInvitation[];
}

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: string;
  lastSeen: string;
}

export interface UserSearchResponse {
  status: string;
  data: UserSearchResult[];
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
  },

  // Récupérer les invitations d'amis reçues (pending)
  async getFriendInvitations(): Promise<FriendInvitationsResponse> {
    const response = await api.get('/friend-invitations');
    return response.data;
  },

  // Accepter ou refuser une invitation d'ami
  async respondToInvitation(friendshipId: string, status: 'accepted' | 'rejected'): Promise<any> {
    const response = await api.put(`/friends/${friendshipId}/respond`, { status });
    return response.data;
  },

  // Accepter ou refuser une invitation d'ami (nouvelle route)
  async respondToFriendInvitation(invitationId: string, status: 'accepted' | 'rejected'): Promise<any> {
    const response = await api.put(`/friend-invitations/${invitationId}/respond`, { status });
    return response.data;
  },

  // Rechercher des utilisateurs par username
  async searchUsers(username: string): Promise<UserSearchResponse> {
    const response = await api.get('/users/search', { params: { username } });
    return response.data;
  }
}; 