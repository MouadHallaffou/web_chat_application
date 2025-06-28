import React, { useState } from 'react';
import FriendsList from '@/components/chat/FriendsList';
import ChatWindow from '@/components/chat/ChatWindow';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage?: string;
  unreadCount?: number;
}

const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: 'AJ',
    isOnline: true,
    lastMessage: 'Hey! How are you doing?',
    unreadCount: 2
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: 'BS',
    isOnline: false,
    lastMessage: 'Thanks for the help earlier',
  },
  {
    id: '3',
    name: 'Carol White',
    avatar: 'CW',
    isOnline: true,
    lastMessage: 'Are we still on for tomorrow?',
    unreadCount: 1
  },
  {
    id: '4',
    name: 'David Brown',
    avatar: 'DB',
    isOnline: true,
    lastMessage: 'Great work on the project!',
  },
  {
    id: '5',
    name: 'Eve Davis',
    avatar: 'ED',
    isOnline: true,
    lastMessage: 'Looking forward to our meeting!',
  },
  {
    id: '6',
    name: 'Frank Wilson',
    avatar: 'FW',
    isOnline: false,
    lastMessage: 'Let me know when you are free',
  },
  {
    id: '7',
    name: 'Grace Lee',
    avatar: 'GL',
    isOnline: true,
    lastMessage: 'Can you send me the files?',
  },
  {
    id: '8',
    name: 'Hank Miller',
    avatar: 'HM',
    isOnline: false,
    lastMessage: 'I will call you later',
  }
];

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  return (
    <div className="flex flex-1 flex-row min-h-0">
      <FriendsList
        friends={mockFriends}
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
