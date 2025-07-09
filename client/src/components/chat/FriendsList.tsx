import React, { useEffect } from 'react';
import { Search } from 'lucide-react';
import { useChatStore } from '@/features/chat/store';

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
  const { loadFriends, friends: storeFriends, isLoading } = useChatStore();

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Utiliser les amis du store si disponibles, sinon utiliser les props
  const displayFriends = storeFriends.length > 0 ? storeFriends : friends;

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col min-h-0 h-full dark:bg-slate-800 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-foreground mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Chargement des amis...</div>
          </div>
        ) : displayFriends.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Aucun ami trouvé</div>
          </div>
        ) : (
          displayFriends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => onSelectFriend(friend)}
            className={`p-4 border-b border-border cursor-pointer transition-all duration-200 hover:bg-muted dark:hover:bg-slate-700 ${
              selectedFriend?.id === friend.id ? 'bg-muted dark:bg-slate-700 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{friend.avatar}</span>
                </div>
                {/* Online indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background dark:border-slate-800 ${
                  (friend.status === 'online' || friend.isOnline) ? 'bg-green-400' : 'bg-muted'
                }`}></div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground truncate">{friend.username || friend.name}</h3>
                  {friend.unreadCount && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {friend.unreadCount}
                    </span>
                  )}
                </div>
                {friend.lastMessage && (
                  <p className="text-muted-foreground text-sm truncate mt-1">{friend.lastMessage}</p>
                )}
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default FriendsList;
