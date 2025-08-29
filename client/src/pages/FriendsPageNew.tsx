import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import FriendSearch from '../components/chat/FriendSearch';
import FriendInvitations from '../components/chat/FriendInvitations';
import FriendsManagement from '../components/chat/FriendsManagement';
import { useNavigate } from 'react-router-dom';

const FriendsPage: React.FC = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const navigate = useNavigate();

    const handleFriendUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleStartConversation = (friendId: string) => {
        navigate(`/chat?friend=${friendId}`);
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Mes amis
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Gérez vos amis, envoyez des invitations et commencez des conversations
                </p>
            </div>

            <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="friends">Mes amis</TabsTrigger>
                    <TabsTrigger value="search">Trouver des amis</TabsTrigger>
                    <TabsTrigger value="invitations">Invitations</TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste de vos amis</CardTitle>
                            <CardDescription>
                                Vos amis actuels. Vous pouvez démarrer une conversation ou gérer vos amitiés.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FriendsManagement
                                onStartConversation={handleStartConversation}
                                refreshTrigger={refreshTrigger}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rechercher des amis</CardTitle>
                            <CardDescription>
                                Recherchez de nouveaux amis par nom d'utilisateur et envoyez-leur des invitations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FriendSearch onFriendAdded={handleFriendUpdate} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invitations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invitations d'amitié</CardTitle>
                            <CardDescription>
                                Gérez les invitations d'amitié que vous avez reçues.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FriendInvitations onInvitationUpdate={handleFriendUpdate} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FriendsPage;
