import React from 'react';
import TestConnection from '@/components/TestConnection';
import { useAuth } from '@/contexts/AuthContext';
import { useChatStore } from '@/features/chat/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TestPage: React.FC = () => {
  const { user } = useAuth();
  const { messages, sendMessage, initializeSocketListeners } = useChatStore();

  React.useEffect(() => {
    if (user) {
      initializeSocketListeners();
    }
  }, [user, initializeSocketListeners]);

  const sendTestMessage = async () => {
    if (!user) return;

    try {
      await sendMessage({
        content: `Message de test - ${new Date().toLocaleTimeString()}`,
        receiverId: user._id,
        type: 'text'
      });
    } catch (error) {
      console.error('Failed to send test message:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Page de Test - Messages Dynamiques</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test de Connexion */}
        <div>
          <TestConnection />
        </div>

        {/* Test des Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Test des Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <Button onClick={sendTestMessage} className="w-full">
                  Envoyer Message de Test
                </Button>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Messages Récents ({messages.length})</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {messages.length === 0 ? (
                      <p className="text-gray-500">Aucun message</p>
                    ) : (
                      messages.slice(-5).map((message) => (
                        <div key={message.id} className="p-2 bg-gray-50 rounded">
                          <p className="text-sm font-medium">
                            {message.senderId === user._id ? 'Vous' : 'Autre'}
                          </p>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500">
                Connectez-vous pour tester les messages
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informations de Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Utilisateur:</strong> {user ? user.username : 'Non connecté'}</p>
            <p><strong>ID Utilisateur:</strong> {user?._id || 'N/A'}</p>
            <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Présent' : 'Absent'}</p>
            <p><strong>Messages en Store:</strong> {messages.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage; 