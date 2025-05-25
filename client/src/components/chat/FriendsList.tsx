
import React from 'react';
import { Search } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage?: string;
  unreadCount?: number;
}

interface FriendsListProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
  selectedFriend?: Friend;
}

const FriendsList = ({ friends, onSelectFriend, selectedFriend }: FriendsListProps) => {
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
    }
  ];

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {mockFriends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => onSelectFriend(friend)}
            className={`p-4 border-b border-slate-700 cursor-pointer transition-all duration-200 hover:bg-slate-700 ${
              selectedFriend?.id === friend.id ? 'bg-slate-700 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{friend.avatar}</span>
                </div>
                {/* Online indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                  friend.isOnline ? 'bg-green-400' : 'bg-slate-500'
                }`}></div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{friend.name}</h3>
                  {friend.unreadCount && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {friend.unreadCount}
                    </span>
                  )}
                </div>
                {friend.lastMessage && (
                  <p className="text-slate-400 text-sm truncate mt-1">{friend.lastMessage}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;
