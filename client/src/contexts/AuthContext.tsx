import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api, { authService } from '../services/api';
import { Navigate, useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  email: string;
  isVerified: boolean;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.register(username, email, password);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (user) {
        setUser(user);
      }
      
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to register');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      navigate('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to logout');
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await authService.forgotPassword(email); 
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to send reset instructions');
      throw err;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      await api.post('/auth/reset-password', { token, password });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      setError(error.response?.data?.message || error.message || 'Erreur lors de la réinitialisation du mot de passe');
      throw err;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      await axios.post('/auth/verify-email', { token });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to verify email');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}; 