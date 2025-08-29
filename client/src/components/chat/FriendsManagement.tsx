import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Users, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';

interface Friend {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: Date;
    friendshipId: string;
    lastInteractionAt?: Date;
}

interface FriendsManagementProps {
    onStartConversation: (friendId: string) => void;
    refreshTrigger?: number;
}

const FriendsManagement: React.FC<FriendsManagementProps> = ({ onStartConversation, refreshTrigger }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingFriend, setRemovingFriend] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchFriends = useCallback(async () => {
        try {
            const response = await api.get('/friendship/friends');
            setFriends(response.data.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des amis:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger la liste des amis',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends, refreshTrigger]);

    const removeFriend = async (friendId: string, friendUsername: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${friendUsername} de vos amis ?`)) {
            return;
        }

        setRemovingFriend(friendId);
        try {
            await api.delete(`/friendship/friends/${friendId}`);
            setFriends(prev => prev.filter(friend => friend.id !== friendId));
            toast({
                title: 'Ami supprimé',
                description: `${friendUsername} a été retiré de votre liste d'amis`,
            });
        } catch (error: unknown) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Impossible de supprimer cet ami',
                variant: 'destructive',
            });
        } finally {
            setRemovingFriend(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'away':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-400';
        }
    };

    const formatLastSeen = (lastSeen?: Date) => {
        if (!lastSeen) return 'Jamais vu en ligne';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'En ligne';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes}m`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Il y a ${diffInDays}j`;

        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Aucun ami
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Commencez par ajouter des amis pour pouvoir discuter avec eux
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Mes amis</h2>
                <Badge variant="secondary">
                    {friends.length} ami{friends.length > 1 ? 's' : ''}
                </Badge>
            </div>

            {friends.map((friend) => (
                <Card key={friend.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage
                                            src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                                            alt={friend.username}
                                        />
                                        <AvatarFallback>
                                            {friend.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(friend.status)}`}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium">{friend.username}</h3>
                                    <p className="text-sm text-gray-500">{friend.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {friend.status === 'online' ? 'En ligne' : formatLastSeen(friend.lastSeen)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => onStartConversation(friend.id)}
                                >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Message
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => removeFriend(friend.id, friend.username)}
                                            disabled={removingFriend === friend.id}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            {removingFriend === friend.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-2" />
                                            )}
                                            Supprimer ami
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default FriendsManagement;
