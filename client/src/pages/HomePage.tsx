import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Bienvenue sur ChatApp</h2>
        <p className="text-muted-foreground text-lg mb-6">
          Bonjour, <span className="text-blue-400 font-semibold">{user?.username || user?.email}</span> !
        </p>
        <p className="text-muted-foreground text-lg">
          Votre expérience de messagerie moderne commence ici
        </p>
      </div>
    </div>
  );
};

export default HomePage; 