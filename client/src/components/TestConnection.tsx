import React, { useState, useEffect } from 'react';
import { socketService } from '@/services/socket.service';
import { messageService } from '@/services/message.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestConnection: React.FC = () => {
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testMessage, setTestMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Tester la connexion API
    testApiConnection();
    
    // Tester la connexion WebSocket si l'utilisateur est connecté
    if (user) {
      testSocketConnection();
    }
  }, [user]);

  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('error');
    }
  };

  const testSocketConnection = async () => {
    if (!user) return;

    try {
      setSocketStatus('connecting');
      const token = localStorage.getItem('token');
      if (!token) {
        setSocketStatus('disconnected');
        return;
      }

      await socketService.connect({
        url: 'http://localhost:5000',
        token
      });
      setSocketStatus('connected');
    } catch (error) {
      setSocketStatus('disconnected');
      console.error('Socket connection failed:', error);
    }
  };

  const sendTestMessage = async () => {
    if (!user || !testMessage.trim()) return;

    try {
      await messageService.sendMessage({
        content: testMessage,
        receiverId: user._id, // Envoyer à soi-même pour le test
        type: 'text'
      });
      setTestMessage('');
    } catch (error) {
      console.error('Failed to send test message:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test de Connexion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>API Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            apiStatus === 'connected' ? 'bg-green-100 text-green-800' :
            apiStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {apiStatus}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>WebSocket Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            socketStatus === 'connected' ? 'bg-green-100 text-green-800' :
            socketStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {socketStatus}
          </span>
        </div>

        {user && (
          <div className="space-y-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Message de test..."
              className="w-full px-3 py-2 border rounded"
            />
            <Button 
              onClick={sendTestMessage}
              disabled={!testMessage.trim() || socketStatus !== 'connected'}
              className="w-full"
            >
              Envoyer Message de Test
            </Button>
          </div>
        )}

        {!user && (
          <div className="text-center text-gray-500">
            Connectez-vous pour tester les WebSockets
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestConnection; 