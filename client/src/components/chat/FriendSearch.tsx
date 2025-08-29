import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Check, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';

interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: Date;
    relationshipStatus: string;
}

interface FriendSearchProps {
    onFriendAdded?: () => void;
}

const FriendSearch: React.FC<FriendSearchProps> = ({ onFriendAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingInvitations, setLoadingInvitations] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const searchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/friendship/search?query=${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data.data || []);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de rechercher des utilisateurs',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, toast]);

    // Recherche des utilisateurs avec debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                searchUsers();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const sendInvitation = async (userId: string, username: string) => {
        setLoadingInvitations(prev => new Set(prev).add(userId));

        try {
            await api.post('/friendship/invitations', {
                receiverId: userId,
                message: `Salut ${username}, j'aimerais être ton ami !`
            });

            toast({
                title: 'Invitation envoyée',
                description: `Invitation d'amitié envoyée à ${username}`,
            });

            // Mettre à jour le status local
            setSearchResults(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, relationshipStatus: 'sent_pending' }
                        : user
                )
            );

            if (onFriendAdded) {
                onFriendAdded();
            }
        } catch (error: unknown) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Impossible d\'envoyer l\'invitation',
                variant: 'destructive',
            });
        } finally {
            setLoadingInvitations(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const getStatusBadge = (status: string, isOnline: boolean) => {
        switch (status) {
            case 'active':
                return <Badge variant="secondary" className="text-green-600">Ami</Badge>;
            case 'sent_pending':
                return <Badge variant="outline" className="text-yellow-600">Invitation envoyée</Badge>;
            case 'received_pending':
                return <Badge variant="outline" className="text-blue-600">Invitation reçue</Badge>;
            case 'sent_rejected':
                return <Badge variant="destructive">Refusée</Badge>;
            case 'blocked':
                return <Badge variant="destructive">Bloqué</Badge>;
            default:
                return isOnline ? (
                    <Badge variant="outline" className="text-green-500">En ligne</Badge>
                ) : (
                    <Badge variant="outline" className="text-gray-500">Hors ligne</Badge>
                );
        }
    };

    const canSendInvitation = (status: string) => {
        return status === 'none' || status === 'sent_rejected';
    };

    const getActionButton = (user: User) => {
        if (loadingInvitations.has(user.id)) {
            return (
                <Button disabled size="sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
            );
        }

        switch (user.relationshipStatus) {
            case 'active':
                return (
                    <Button variant="outline" size="sm" disabled>
                        <Check className="w-4 h-4 mr-1" />
                        Ami
                    </Button>
                );
            case 'sent_pending':
                return (
                    <Button variant="outline" size="sm" disabled>
                        <Clock className="w-4 h-4 mr-1" />
                        En attente
                    </Button>
                );
            case 'received_pending':
                return (
                    <Button variant="outline" size="sm" disabled>
                        <Clock className="w-4 h-4 mr-1" />
                        Répondre
                    </Button>
                );
            case 'blocked':
                return (
                    <Button variant="destructive" size="sm" disabled>
                        <X className="w-4 h-4 mr-1" />
                        Bloqué
                    </Button>
                );
            default:
                if (canSendInvitation(user.relationshipStatus)) {
                    return (
                        <Button
                            size="sm"
                            onClick={() => sendInvitation(user.id, user.username)}
                        >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Ajouter
                        </Button>
                    );
                }
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Rechercher des amis par nom d'utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
            </div>

            {searchResults.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Résultats de recherche
                    </h3>
                    {searchResults.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage
                                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                alt={user.username}
                                            />
                                            <AvatarFallback>
                                                {user.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusBadge(user.relationshipStatus, user.status === 'online')}
                                        {getActionButton(user)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun utilisateur trouvé pour "{searchQuery}"</p>
                </div>
            )}

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                    Tapez au moins 2 caractères pour rechercher
                </div>
            )}
        </div>
    );
};

export default FriendSearch;
