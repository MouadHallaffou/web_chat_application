import React, { useEffect, useState } from 'react';
import { Search, Users, Clock, CheckCircle, XCircle, UserX, MessageCircle, UserPlus } from 'lucide-react';
import { useChatStore } from '@/features/chat/store';
import { friendshipService, UserSearchResult } from '@/services/friendship.service';
import { useAuth } from '@/contexts/AuthContext';

interface Friend {
  id: string;
  name?: string;
  username?: string;
  avatar: string;
  isOnline?: boolean;
  status?: string;
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

  // Debug: Afficher l'état de l'utilisateur
  console.log('FriendsList - User:', user);
  console.log('FriendsList - Token:', localStorage.getItem('token'));

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
        // Le backend fournit déjà le relationshipStatus, pas besoin de filtrer ici
        setSearchResults(res.data);
      } catch (err) {
        console.error('Erreur lors de la recherche:', err);
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as any;
          if (axiosErr.response?.status === 401) {
            setSearchError("Vous devez être connecté pour rechercher des utilisateurs");
          } else if (axiosErr.response?.status === 400) {
            setSearchError("Requête invalide - vérifiez votre saisie");
          } else {
            setSearchError(`Erreur lors de la recherche (${axiosErr.response?.status || 'inconnu'})`);
          }
        } else {
          setSearchError("Erreur de connexion au serveur");
        }
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, storeFriends, friendInvitations, user]);

  // Utiliser les amis du store si disponibles, sinon utiliser les props
  const displayFriends = storeFriends.length > 0 ? storeFriends : friends;

  // Debug: Afficher les amis chargés
  console.log('FriendsList - storeFriends:', storeFriends);
  console.log('FriendsList - props friends:', friends);
  console.log('FriendsList - displayFriends:', displayFriends);
  console.log('FriendsList - isLoading:', isLoading);

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
      console.error('Erreur lors de la recherche:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        if (axiosErr.response?.status === 401) {
          setSearchError("Vous devez être connecté pour rechercher des utilisateurs");
        } else if (axiosErr.response?.status === 400) {
          setSearchError("Requête invalide - vérifiez votre saisie");
        } else {
          setSearchError(`Erreur lors de la recherche (${axiosErr.response?.status || 'inconnu'})`);
        }
      } else {
        setSearchError("Erreur de connexion au serveur");
      }
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handler invitation
  const handleInvite = async (userId: string) => {
    setInviteSent(null);
    setSearchError(null);
    try {
      await friendshipService.sendFriendRequest(userId);
      setInviteSent(userId);
      loadFriendInvitations(); // refresh
    } catch (err) {
      console.error('Erreur lors de l\'envoi d\'invitation:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        if (axiosErr.response?.status === 400) {
          const message = axiosErr.response?.data?.message || 'Erreur lors de l\'envoi';
          if (message.includes('déjà amis') || message.includes('relation est bloquée')) {
            setSearchError("Vous êtes déjà amis avec cette personne ou une relation existe déjà");
          } else if (message.includes('invitation est déjà en cours')) {
            setSearchError("Une invitation est déjà en cours avec cette personne");
          } else {
            setSearchError(`Impossible d'envoyer l'invitation: ${message}`);
          }
        } else if (axiosErr.response?.status === 401) {
          setSearchError("Vous devez être connecté pour envoyer une invitation");
        } else {
          setSearchError(`Erreur lors de l'envoi de l'invitation (${axiosErr.response?.status || 'inconnu'})`);
        }
      } else {
        setSearchError("Erreur de connexion lors de l'envoi de l'invitation");
      }
    }
  };

  // Handler pour cliquer sur un utilisateur (ouvrir conversation)
  const handleUserClick = (user: UserSearchResult) => {
    // Vérifier si l'utilisateur peut ouvrir une conversation
    if (user.relationshipStatus === 'active' ||
      user.relationshipStatus === 'sent_accepted' ||
      user.relationshipStatus === 'received_accepted') {
      // Convertir UserSearchResult en Friend pour la conversation
      const friendData = {
        id: user.id,
        name: user.username,
        username: user.username,
        avatar: user.avatar || user.username.charAt(0).toUpperCase(),
        isOnline: user.status === 'online',
        status: user.status,
        lastMessage: '',
        unreadCount: 0
      };
      onSelectFriend(friendData);
    }
  };

  // Handler accepter/refuser invitation
  const handleRespond = async (invitationId: string, status: 'accepted' | 'rejected') => {
    console.log(`Tentative de réponse à l'invitation ${invitationId} avec status: ${status}`);
    setRespondingId(invitationId);
    setRespondError(null);
    try {
      console.log('Appel de friendshipService.respondToFriendInvitation...');
      const response = await friendshipService.respondToFriendInvitation(invitationId, status);
      console.log('Réponse reçue:', response);

      await loadFriendInvitations();
      await loadFriends(); // Recharger les amis car une nouvelle amitié peut être créée

      if (status === 'accepted') {
        // Afficher un message de succès
        console.log('Invitation acceptée ! Nouvelle amitié créée.');

        // Recharger les amis après un délai pour s'assurer que la base de données est mise à jour
        setTimeout(async () => {
          await loadFriends();

          // Trouver le nouvel ami dans la liste à jour et le sélectionner
          const updatedFriends = storeFriends.length > 0 ? storeFriends : friends;
          const invitation = friendInvitations.find(i => i._id === invitationId);
          if (invitation) {
            const newFriend = updatedFriends.find(f => f.id === invitation.senderId.id);
            if (newFriend) {
              onSelectFriend(newFriend);
            }
          }
        }, 500);
      }
    } catch (err) {
      console.error('Erreur détaillée lors de la réponse à l\'invitation:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        console.error('Status:', axiosErr.response?.status);
        console.error('Data:', axiosErr.response?.data);
        setRespondError(`Erreur lors de la réponse à l'invitation: ${axiosErr.response?.data?.message || axiosErr.message}`);
      } else {
        setRespondError("Erreur lors de la réponse à l'invitation");
      }
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
              placeholder={user ? "Rechercher un utilisateur..." : "Connectez-vous pour rechercher"}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
              disabled={!user}
            />
          </div>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
        </div>
        {/* Résultats recherche utilisateur */}
        {searchLoading && <div className="text-xs text-muted-foreground">Recherche...</div>}
        {searchError && <div className="text-xs text-red-500">{searchError}</div>}
        {searchResults.length > 0 && (
          <div className="bg-muted rounded p-2 mt-1 max-h-48 overflow-y-auto">
            {/* Message d'aide */}
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MessageCircle size={10} />
              <span>Cliquez sur un ami pour ouvrir une conversation</span>
            </div>
            {searchResults.map(user => {
              const getButtonContent = () => {
                // Utiliser relationshipStatus du backend avec des icônes significatives
                switch (user.relationshipStatus) {
                  case 'active':
                    return (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-semibold" title="Vous êtes amis">
                        <Users size={14} />
                        <span>Ami</span>
                      </div>
                    );

                  case 'sent_pending':
                    return (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 font-semibold" title="Invitation envoyée, en attente de réponse">
                        <Clock size={14} />
                        <span>Envoyée</span>
                      </div>
                    );

                  case 'received_pending':
                    return (
                      <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold" title="Invitation reçue, en attente de votre réponse">
                        <Clock size={14} />
                        <span>Reçue</span>
                      </div>
                    );

                  case 'sent_accepted':
                  case 'received_accepted':
                    return (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-semibold" title="Invitation acceptée, vous êtes maintenant amis">
                        <CheckCircle size={14} />
                        <span>Amis</span>
                      </div>
                    );

                  case 'sent_rejected':
                    return (
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold" title="Votre invitation a été refusée">
                        <XCircle size={14} />
                        <span>Refusée</span>
                      </div>
                    );

                  case 'received_rejected':
                    return (
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold" title="Invitation rejetée par vous">
                        <XCircle size={14} />
                        <span>Rejetée</span>
                      </div>
                    );

                  case 'blocked':
                    return (
                      <div className="flex items-center gap-1 text-xs text-red-600 font-semibold" title="Utilisateur bloqué">
                        <UserX size={14} />
                        <span>Bloqué</span>
                      </div>
                    );

                  case 'none':
                  default:
                    return (
                      <button
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${inviteSent === user.id
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        disabled={inviteSent === user.id}
                        title={inviteSent === user.id ? 'Invitation envoyée' : 'Envoyer une invitation d\'ami'}
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher la propagation du clic
                          handleInvite(user.id);
                        }}
                      >
                        <UserPlus size={14} />
                        <span>{inviteSent === user.id ? 'Envoyée' : 'Inviter'}</span>
                      </button>
                    );
                }
              }; return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between py-2 px-2 rounded transition-all duration-200 ${
                    // Rendre clickable si on peut ouvrir une conversation
                    (user.relationshipStatus === 'active' ||
                      user.relationshipStatus === 'sent_accepted' ||
                      user.relationshipStatus === 'received_accepted')
                      ? 'cursor-pointer hover:bg-background/50 border border-transparent hover:border-blue-200 hover:shadow-sm hover:scale-[1.02] group'
                      : 'cursor-default'
                    }`}
                  title={(user.relationshipStatus === 'active' ||
                    user.relationshipStatus === 'sent_accepted' ||
                    user.relationshipStatus === 'received_accepted')
                    ? `Cliquer pour ouvrir une conversation avec ${user.username}`
                    : undefined}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Indicateur de statut en ligne */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-medium truncate">{user.username}</span>
                        {/* Icône de conversation pour les amis */}
                        {(user.relationshipStatus === 'active' ||
                          user.relationshipStatus === 'sent_accepted' ||
                          user.relationshipStatus === 'received_accepted') && (
                            <MessageCircle size={12} className="text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                          )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.status === 'online' ? 'En ligne' : `Vu ${new Date(user.lastSeen).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getButtonContent()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invitations d'amis reçues */}
      {friendInvitations.length > 0 && (
        <div className="p-4 border-b border-border bg-muted dark:bg-slate-700">
          <h3 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
            <Clock size={16} />
            Invitations reçues ({friendInvitations.length})
          </h3>
          {respondError && <div className="text-xs text-red-500 mb-1">{respondError}</div>}
          <div className="space-y-2">
            {friendInvitations.map(invite => (
              <div key={invite._id} className="flex items-center justify-between bg-background rounded-lg p-2 border border-blue-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    {invite.senderId.avatar ? (
                      <img src={invite.senderId.avatar} alt={invite.senderId.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {invite.senderId.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-foreground text-sm font-medium">{invite.senderId.username}</span>
                    <div className="text-xs text-muted-foreground">Veut être votre ami</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-60 transition-colors"
                    disabled={respondingId === invite._id}
                    onClick={() => handleRespond(invite._id, 'accepted')}
                    title="Accepter l'invitation d'ami"
                  >
                    <CheckCircle size={12} />
                    {respondingId === invite._id ? '...' : 'Accepter'}
                  </button>
                  <button
                    className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-60 transition-colors"
                    disabled={respondingId === invite._id}
                    onClick={() => handleRespond(invite._id, 'rejected')}
                    title="Refuser l'invitation d'ami"
                  >
                    <XCircle size={12} />
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
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <Users className="w-8 h-8 text-muted-foreground mb-2" />
            <div className="text-muted-foreground text-sm">
              {friendInvitations.length > 0
                ? "Aucun ami pour le moment. Acceptez une invitation pour commencer à chatter !"
                : "Aucun ami trouvé. Recherchez des utilisateurs pour envoyer des invitations !"}
            </div>
          </div>
        ) : (
          displayFriends.map((friend) => (
            <div
              key={friend.id}
              onClick={() => onSelectFriend(friend)}
              className={`p-4 border-b border-border cursor-pointer transition-all duration-200 hover:bg-muted dark:hover:bg-slate-700 ${selectedFriend?.id === friend.id ? 'bg-muted dark:bg-slate-700 border-l-4 border-l-blue-500' : ''
                }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{friend.avatar}</span>
                  </div>
                  {/* Online indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background dark:border-slate-800 ${(friend.status === 'online' || friend.isOnline) ? 'bg-green-400' : 'bg-muted'
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
