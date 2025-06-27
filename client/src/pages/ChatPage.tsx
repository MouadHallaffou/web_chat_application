import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import FriendsList from '@/components/chat/FriendsList';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth, AuthGuard } from '@/contexts/AuthContext';
import EditProfileForm from '@/components/auth/EditProfileForm';
import { showToast } from '@/components/ui/toast';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Optionnel : fetch user info, etc.
      navigate('/chat', { replace: true }); // Nettoie l'URL
    }
  }, [location, navigate]);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleDropdownSelect = async (action: string) => {
    setShowDropdown(false);
    if (action === 'edit') {
      setShowEditProfile(true);
      setActiveTab('settings');
    } else if (action === 'logout') {
      const result = await Swal.fire({
        title: 'Déconnexion',
        text: 'Voulez-vous vraiment vous déconnecter ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, se déconnecter',
        cancelButtonText: 'Annuler',
        reverseButtons: true,
      });
      if (result.isConfirmed) {
        if (logout) logout();
      }
    }
  };

  return (
    <div className="h-screen min-h-0 bg-background text-foreground flex transition-colors duration-200 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with improved style and profile dropdown */}
        <header className="px-4 py-2 border-b border-border flex items-center justify-between bg-background text-foreground dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-md">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
            Bonjour, <span className="text-blue-400">{user ? user.username || user.email : 'Invité'}</span> !
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-slate-200 transition group focus:outline-none dark:hover:bg-slate-700"
                onClick={() => setShowDropdown((v) => !v)}
                aria-haspopup="true"
                aria-expanded={showDropdown}
              >
                {user && user.avatar ? (
                  <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}`} 
                  alt="Avatar"
                  className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 dark:border-blue-400 shadow-md dark:shadow-blue-900/20"
                  />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-r from-green-400 to-blue-500 dark:from-green-500 dark:to-blue-600 rounded-full flex items-center justify-center shadow-md dark:shadow-blue-900/30 transition-colors duration-200">
                  <span className="text-white font-semibold text-lg drop-shadow-sm">
                    {user ? user.username?.charAt(0).toUpperCase() : 'U'}
                  </span>
                  </div>
                )}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-foreground font-medium leading-tight">
                    {user ? user.username || user.email : 'Invité'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${user ? 'bg-green-400' : 'bg-slate-400'} rounded-full`}></span>
                    <span className="text-xs text-muted-foreground">{user ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-muted-foreground ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 animate-fade-in">
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-t-lg transition"
                    onClick={() => handleDropdownSelect('edit')}
                  >
                    Modifier le profil
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-red-100 dark:hover:bg-red-600 text-red-600 dark:text-red-200 rounded-b-lg transition"
                    onClick={() => handleDropdownSelect('logout')}
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {activeTab === 'chat' && (
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
          )}
          {activeTab === 'settings' && (
            <div className="flex-1 flex items-center justify-center bg-background custom-scrollbar overflow-y-auto">
              <EditProfileForm />
            </div>
          )}
          {activeTab === 'home' && (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-4">Bienvenue sur ChatApp</h2>
                <p className="text-muted-foreground text-lg">
                  Votre expérience de messagerie moderne commence ici
                </p>
              </div>
            </div>
          )}
          {activeTab !== 'chat' && activeTab !== 'home' && activeTab !== 'settings' && (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProtectedChatPage() {
  return (
    <AuthGuard>
      <ChatPage />
    </AuthGuard>
  );
}
