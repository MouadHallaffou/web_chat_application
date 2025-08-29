import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2, Clock, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';

interface Sender {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: Date;
}

interface Invitation {
    _id: string;
    senderId: Sender;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

interface FriendInvitationsProps {
    onInvitationUpdate?: () => void;
}

const FriendInvitations: React.FC<FriendInvitationsProps> = ({ onInvitationUpdate }) => {
    const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [respondingTo, setRespondingTo] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = useCallback(async () => {
        try {
            const response = await api.get('/friendship/invitations/received');
            setReceivedInvitations(response.data.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des invitations:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les invitations',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const respondToInvitation = async (invitationId: string, action: 'accept' | 'reject', senderUsername: string) => {
        setRespondingTo(prev => new Set(prev).add(invitationId));

        try {
            await api.patch(`/friendship/invitations/${invitationId}/respond`, { action });

            toast({
                title: action === 'accept' ? 'Invitation acceptée' : 'Invitation refusée',
                description: action === 'accept'
                    ? `Vous êtes maintenant ami avec ${senderUsername}`
                    : `Invitation de ${senderUsername} refusée`,
                variant: action === 'accept' ? 'default' : 'destructive',
            });

            // Supprimer l'invitation de la liste
            setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));

            if (onInvitationUpdate) {
                onInvitationUpdate();
            }
        } catch (error: unknown) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : `Impossible de ${action === 'accept' ? 'accepter' : 'refuser'} l'invitation`,
                variant: 'destructive',
            });
        } finally {
            setRespondingTo(prev => {
                const newSet = new Set(prev);
                newSet.delete(invitationId);
                return newSet;
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Il y a quelques minutes';
        } else if (diffInHours < 24) {
            return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (receivedInvitations.length === 0) {
        return (
            <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Aucune invitation
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Vous n'avez pas d'invitations d'amitié en attente
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Invitations reçues</h2>
                <Badge variant="secondary">
                    {receivedInvitations.length} en attente
                </Badge>
            </div>

            {receivedInvitations.map((invitation) => (
                <Card key={invitation._id}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                                <AvatarImage
                                    src={invitation.senderId.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${invitation.senderId.username}`}
                                    alt={invitation.senderId.username}
                                />
                                <AvatarFallback>
                                    {invitation.senderId.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-base">
                                    {invitation.senderId.username}
                                </CardTitle>
                                <p className="text-sm text-gray-500">
                                    {invitation.senderId.email}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDate(invitation.createdAt)}
                                </p>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Badge variant="outline" className="text-blue-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    En attente
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    {invitation.message && (
                        <CardContent className="pt-0 pb-3">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-sm italic">
                                    "{invitation.message}"
                                </p>
                            </div>
                        </CardContent>
                    )}

                    <CardContent className="pt-0">
                        <div className="flex space-x-2">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => respondToInvitation(invitation._id, 'accept', invitation.senderId.username)}
                                disabled={respondingTo.has(invitation._id)}
                                className="flex-1"
                            >
                                {respondingTo.has(invitation._id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Accepter
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => respondToInvitation(invitation._id, 'reject', invitation.senderId.username)}
                                disabled={respondingTo.has(invitation._id)}
                                className="flex-1"
                            >
                                {respondingTo.has(invitation._id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <X className="w-4 h-4 mr-1" />
                                        Refuser
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default FriendInvitations;
