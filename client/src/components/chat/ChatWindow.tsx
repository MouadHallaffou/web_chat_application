import React, { useState } from 'react';
import { Camera, Mic, Search, Video } from 'lucide-react';

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
  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! How are you doing today?',
      sender: 'other',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: '2',
      text: 'I\'m doing great! Just finished working on a new project. How about you?',
      sender: 'me',
      timestamp: new Date(Date.now() - 3300000),
      type: 'text'
    },
    {
      id: '3',
      text: 'That sounds awesome! I\'d love to hear more about it.',
      sender: 'other',
      timestamp: new Date(Date.now() - 3000000),
      type: 'text'
    },
    {
      id: '4',
      text: 'Sure! It\'s a real-time chat application with video calling features. Pretty excited about it!',
      sender: 'me',
      timestamp: new Date(Date.now() - 2700000),
      type: 'text'
    },
    {
      id: '5',
      text: 'Wow, that sounds amazing! I can\'t wait to try it out.',
      sender: 'other',
      timestamp: new Date(Date.now() - 2400000),
      type: 'text'
    },
    {
      id: '6',
      text: 'Here\'s a screenshot of the UI I designed for it.',
      sender: 'me',
      timestamp: new Date(Date.now() - 2100000),
      type: 'image'
    },
    {
      id: '7',
      text: 'Looks great! I love the color scheme you chose.',
      sender: 'other',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: '8',
      text: 'Thanks! I wanted something modern and sleek.',
      sender: 'me',
      timestamp: new Date(Date.now() - 1500000),
      type: 'text'
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'me'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-muted text-foreground dark:bg-slate-700'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'me' ? 'text-blue-100' : 'text-muted-foreground'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
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
