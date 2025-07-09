import React, { useState } from 'react';
import FriendsList from '@/components/chat/FriendsList';
import ChatWindow from '@/components/chat/ChatWindow';
import { useChatStore } from '@/features/chat/store';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage?: string;
  unreadCount?: number;
}

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Utiliser les amis dynamiques du store Zustand
  const { friends, isLoading } = useChatStore();

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  return (
    <div className="flex flex-1 flex-row min-h-0">
      <FriendsList
        friends={friends}
        onSelectFriend={handleSelectFriend}
        selectedFriend={selectedFriend || undefined}
      />
      <div className="flex-1 flex flex-col min-h-0">
        {selectedFriend ? (
          <ChatWindow selectedFriend={selectedFriend} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">💬</span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Sélectionnez une conversation
              </h2>
              <p className="text-muted-foreground">
                Choisissez un ami dans la barre latérale pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
