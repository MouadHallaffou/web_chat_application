
import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
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

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'chat' && (
        <>
          <FriendsList
            friends={[]}
            onSelectFriend={handleSelectFriend}
            selectedFriend={selectedFriend || undefined}
          />
          
          {selectedFriend ? (
            <ChatWindow selectedFriend={selectedFriend} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-2xl">💬</span>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Select a conversation
                </h2>
                <p className="text-slate-400">
                  Choose a friend from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'home' && (
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to ChatApp</h2>
            <p className="text-slate-400 text-lg">
              Your modern messaging experience starts here
            </p>
          </div>
        </div>
      )}
      
      {activeTab !== 'chat' && activeTab !== 'home' && (
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-slate-400">This feature is coming soon!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
