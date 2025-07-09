import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Search, Video } from 'lucide-react';
import { useChatStore } from '@/features/chat/store';
import { socketService } from '@/services/socket.service';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'video';
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface ChatWindowProps {
  selectedFriend: Friend;
}

const ChatWindow = ({ selectedFriend }: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Utiliser le store Zustand pour les messages et conversations
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    loadMessages, 
    initializeSocketListeners,
    conversations
  } = useChatStore();

  // Utiliser le contexte d'authentification
  const { user } = useAuth();

  // Trouver la conversation correspondante (1-1) dans le store
  const conversation = conversations.find(conv =>
    conv.participants.length === 2 &&
    conv.participants.includes(user?._id) &&
    conv.participants.includes(selectedFriend.id)
  );

  // Initialiser les listeners WebSocket au montage du composant
  useEffect(() => {
    initializeSocketListeners();
  }, [initializeSocketListeners]);

  // Charger les messages quand une conversation existe et un ami est sélectionné
  useEffect(() => {
    if (selectedFriend?.id && conversation?.id) {
      loadMessages(conversation.id);
    }
  }, [selectedFriend?.id, conversation?.id, loadMessages]);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedFriend?.id) {
      try {
        await sendMessage({
          content: newMessage,
          receiverId: selectedFriend.id,
          type: 'text'
        });
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground min-h-0 h-full dark:bg-slate-800">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background shrink-0 dark:bg-slate-800 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{selectedFriend.avatar}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background dark:border-slate-800 ${
                selectedFriend.isOnline ? 'bg-green-500' : 'bg-muted'
              }`}></div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground ">{selectedFriend.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedFriend.isOnline ? 'Active now' : 'Last seen recently'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Video size={20} />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Camera size={20} />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : !conversation ? (
          <div className="flex justify-center">
            <div className="text-muted-foreground">Aucune conversation trouvée avec cet ami.</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center">
            <div className="text-muted-foreground">No messages yet. Start a conversation!</div>
          </div>
        ) : (
          messages.map((message) => {
            // Déterminer si le message est de l'utilisateur actuel
            const isOwnMessage = message.senderId === user?._id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-muted text-foreground dark:bg-slate-700'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-blue-100' : 'text-muted-foreground'
                  }`}>
                    {formatTime(new Date(message.timestamp))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background dark:bg-slate-800 dark:border-slate-800">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-muted border border-border rounded-full text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <button
            type="button"
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <Mic size={20} />
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
