import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../services/api';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await axios.post('/auth/logout');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to logout');
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await axios.post('/auth/forgot-password', { email });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset instructions');
      throw err;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      await axios.post('/auth/reset-password', { token, password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
      throw err;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      await axios.post('/auth/verify-email', { token });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify email');
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