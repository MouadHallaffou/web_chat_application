import api from './api';

// Types
export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  replyTo?: {
    _id: string;
    content: string;
    senderId: {
      username: string;
    };
  };
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    filePath?: string;
    mimeType?: string;
    thumbnailUrl?: string;
    isEdited?: boolean;
    editedAt?: Date;
  };
  status: 'sent' | 'delivered' | 'read';
  readBy: {
    userId: string;
    readAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  friend?: {
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: Date;
  };
  participants?: {
    _id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Service de chat
class ChatService {
  // Récupérer toutes les conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations');
    return response.data.data || [];
  }

  // Récupérer ou créer une conversation avec un ami
  async getOrCreateConversation(friendId: string): Promise<Conversation> {
    const response = await api.get(`/chat/conversations/${friendId}`);
    return response.data.data;
  }

  // Récupérer les messages d'une conversation
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return {
      messages: response.data.data || [],
      pagination: response.data.pagination || { page: 1, limit: 50, hasMore: false }
    };
  }

  // Envoyer un message texte
  async sendMessage(conversationId: string, content: string, replyToId?: string): Promise<Message> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      replyToId
    });
    return response.data.data;
  }

  // Envoyer un fichier
  async sendFile(conversationId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/chat/conversations/${conversationId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Marquer les messages comme lus
  async markAsRead(conversationId: string): Promise<{ markedCount: number }> {
    const response = await api.patch(`/chat/conversations/${conversationId}/read`);
    return response.data.data;
  }

  // Éditer un message
  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await api.patch(`/chat/messages/${messageId}`, { content });
    return response.data.data;
  }

  // Supprimer un message
  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/chat/messages/${messageId}`);
  }

  // Télécharger un fichier
  getFileUrl(filePath: string): string {
    // Retourne l'URL complète pour télécharger le fichier
    return `${api.defaults.baseURL?.replace('/api', '')}${filePath}`;
  }

  // Vérifier si un fichier est une image
  isImage(mimeType?: string): boolean {
    return mimeType?.startsWith('image/') || false;
  }

  // Vérifier si un fichier est une vidéo
  isVideo(mimeType?: string): boolean {
    return mimeType?.startsWith('video/') || false;
  }

  // Vérifier si un fichier est un audio
  isAudio(mimeType?: string): boolean {
    return mimeType?.startsWith('audio/') || false;
  }

  // Formater la taille du fichier
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Formater la date/heure des messages
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    
    // Si c'est aujourd'hui, afficher seulement l'heure
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si c'est hier
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Pour les autres dates
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const chatService = new ChatService();
