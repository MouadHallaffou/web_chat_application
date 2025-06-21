import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');

  useEffect(() => {
    setMode(location.pathname === '/register' ? 'register' : 'login');
  }, [location]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full min-w-[280px] max-w-md mx-auto">
        {mode === 'login' ? (
          <LoginForm onAuthSuccess={onAuthSuccess} />
        ) : (
          <RegisterForm onAuthSuccess={onAuthSuccess} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
