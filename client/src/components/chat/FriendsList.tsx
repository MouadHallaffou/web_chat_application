import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useChatStore } from '@/features/chat/store';
import { friendshipService, UserSearchResult } from '@/services/friendship.service';
import { useAuth } from '@/contexts/AuthContext';

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
  const { loadFriends, friends: storeFriends, isLoading, friendInvitations, loadFriendInvitations } = useChatStore();
  const { user } = useAuth();

  // Recherche utilisateur
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
    loadFriendInvitations();
  }, [loadFriends, loadFriendInvitations]);

  // Recherche utilisateur en temps réel (debounce)
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    const handler = setTimeout(async () => {
      setSearchError(null);
      setInviteSent(null);
      try {
        const res = await friendshipService.searchUsers(searchTerm.trim());
        // Filtrer les résultats : exclure user courant, amis, invitations déjà envoyées/reçues/acceptées
        const friendIds = storeFriends.map(f => f.id);
        const invitedPendingIds = friendInvitations.filter(i => i.status === 'pending').map(i => i.senderId.id).concat(friendInvitations.filter(i => i.status === 'pending').map(i => i.receiverId));
        const invitedAcceptedIds = friendInvitations.filter(i => i.status === 'accepted').map(i => i.senderId.id).concat(friendInvitations.filter(i => i.status === 'accepted').map(i => i.receiverId));
        const filtered = res.data.filter(u =>
          u.id !== user?._id &&
          !friendIds.includes(u.id) &&
          !invitedPendingIds.includes(u.id) &&
          !invitedAcceptedIds.includes(u.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        setSearchError("Erreur lors de la recherche");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, storeFriends, friendInvitations, user]);

  // Utiliser les amis du store si disponibles, sinon utiliser les props
  const displayFriends = storeFriends.length > 0 ? storeFriends : friends;

  // Handler recherche utilisateur
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setInviteSent(null);
    if (searchTerm.trim().length < 2) {
      setSearchError('Au moins 2 caractères');
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await friendshipService.searchUsers(searchTerm.trim());
      setSearchResults(res.data);
    } catch (err) {
      setSearchError("Erreur lors de la recherche");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handler invitation
  const handleInvite = async (userId: string) => {
    setInviteSent(null);
    try {
      await friendshipService.sendFriendRequest(userId);
      setInviteSent(userId);
      loadFriendInvitations(); // refresh
    } catch (err) {
      setSearchError("Erreur lors de l'envoi de l'invitation");
    }
  };

  // Handler accepter/refuser invitation
  const handleRespond = async (invitationId: string, status: 'accepted' | 'rejected') => {
    setRespondingId(invitationId);
    setRespondError(null);
    try {
      await friendshipService.respondToFriendInvitation(invitationId, status);
      await loadFriendInvitations();
      await loadFriends();
      if (status === 'accepted') {
        // Trouver le nouvel ami dans la liste à jour et le sélectionner
        setTimeout(() => {
          const updatedFriends = storeFriends.length > 0 ? storeFriends : friends;
          const invitation = friendInvitations.find(i => i._id === invitationId);
          if (invitation) {
            const newFriend = updatedFriends.find(f => f.id === invitation.senderId.id);
            if (newFriend) {
              onSelectFriend(newFriend);
            }
          }
        }, 300);
      }
    } catch (err) {
      setRespondError("Erreur lors de la réponse à l'invitation");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col min-h-0 h-full dark:bg-slate-800 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-foreground mb-4">Messages</h2>
        {/* Search */}
        <div className="relative mb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
        </div>
        {/* Résultats recherche utilisateur */}
        {searchLoading && <div className="text-xs text-muted-foreground">Recherche...</div>}
        {searchError && <div className="text-xs text-red-500">{searchError}</div>}
        {searchResults.length > 0 && (
          <div className="bg-muted rounded p-2 mt-1 max-h-40 overflow-y-auto">
            {searchResults.map(user => {
              const isFriend = storeFriends.some(f => f.id === user.id);
              const isPending = friendInvitations.some(i => (i.senderId.id === user.id || i.receiverId === user.id) && i.status === 'pending');
              const isAccepted = friendInvitations.some(i => (i.senderId.id === user.id || i.receiverId === user.id) && i.status === 'accepted');
              return (
                <div key={user.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <img src={user.avatar} className="text-white text-xs font-semibold"/>
                    </div>
                    <span className="text-foreground text-xs font-medium">{user.username}</span>
                  </div>
                  {isFriend ? (
                    <span className="text-xs text-green-600 font-semibold">Déjà ami</span>
                  ) : isAccepted ? (
                    <span className="text-xs text-blue-600 font-semibold">Invitation acceptée</span>
                  ) : isPending ? (
                    <span className="text-xs text-yellow-600 font-semibold">Invitation envoyée</span>
                  ) : (
                    <button
                      className={`px-2 py-1 text-xs rounded ${inviteSent === user.id ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      disabled={inviteSent === user.id}
                      onClick={() => handleInvite(user.id)}
                    >
                      {inviteSent === user.id ? 'Invitation envoyée' : 'Inviter'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invitations d'amis reçues */}
      {friendInvitations.length > 0 && (
        <div className="p-4 border-b border-border bg-muted dark:bg-slate-700">
          <h3 className="font-semibold text-foreground mb-2 text-sm">Invitations reçues</h3>
          {respondError && <div className="text-xs text-red-500 mb-1">{respondError}</div>}
          <div className="space-y-2">
            {friendInvitations.map(invite => (
              <div key={invite._id} className="flex items-center justify-between bg-background rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{invite.senderId.avatar}</span>
                  </div>
                  <span className="text-foreground text-sm font-medium">{invite.senderId.username}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-60"
                    disabled={respondingId === invite._id}
                    onClick={() => handleRespond(invite._id, 'accepted')}
                  >
                    {respondingId === invite._id ? '...' : 'Accepter'}
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-60"
                    disabled={respondingId === invite._id}
                    onClick={() => handleRespond(invite._id, 'rejected')}
                  >
                    {respondingId === invite._id ? '...' : 'Refuser'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
