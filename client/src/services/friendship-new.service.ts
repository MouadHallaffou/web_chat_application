import api from './api';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  relationshipStatus: string;
}

export interface Friend {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  friendshipId: string;
  lastInteractionAt?: Date;
}

export interface Invitation {
  _id: string;
  senderId: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: Date;
  };
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

// Service de gestion des amitiés
class FriendshipService {
  // Rechercher des utilisateurs
  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get(`/friendship/search?query=${encodeURIComponent(query)}`);
    return response.data.data || [];
  }

  // Envoyer une invitation d'amitié
  async sendInvitation(receiverId: string, message?: string): Promise<Invitation> {
    const response = await api.post('/friendship/invitations', {
      receiverId,
      message
    });
    return response.data.data;
  }

  // Récupérer les invitations reçues
  async getReceivedInvitations(): Promise<Invitation[]> {
    const response = await api.get('/friendship/invitations/received');
    return response.data.data || [];
  }

  // Récupérer les invitations envoyées
  async getSentInvitations(): Promise<Invitation[]> {
    const response = await api.get('/friendship/invitations/sent');
    return response.data.data || [];
  }

  // Répondre à une invitation (accepter/refuser)
  async respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<void> {
    await api.patch(`/friendship/invitations/${invitationId}/respond`, { action });
  }

  // Annuler une invitation envoyée
  async cancelInvitation(invitationId: string): Promise<void> {
    await api.delete(`/friendship/invitations/${invitationId}`);
  }

  // Récupérer la liste des amis
  async getFriends(): Promise<Friend[]> {
    const response = await api.get('/friendship/friends');
    return response.data.data || [];
  }

  // Supprimer un ami
  async removeFriend(friendId: string): Promise<void> {
    await api.delete(`/friendship/friends/${friendId}`);
  }

  // Bloquer un utilisateur (à implémenter plus tard)
  async blockUser(userId: string): Promise<void> {
    // TODO: Implémenter le blocage d'utilisateur
    throw new Error('Fonctionnalité non encore implémentée');
  }

  // Débloquer un utilisateur (à implémenter plus tard)
  async unblockUser(userId: string): Promise<void> {
    // TODO: Implémenter le déblocage d'utilisateur
    throw new Error('Fonctionnalité non encore implémentée');
  }
}

export const friendshipService = new FriendshipService();
