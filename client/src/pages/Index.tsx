
import React, { useState } from 'react';
import AuthPage from './AuthPage';
import ChatPage from './ChatPage';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <ChatPage />;
};

export default Index;
