/*
 * Fichier : client/src/App.tsx
 * Rôle : Composant racine de l'application React.
 * - Définit la structure des routes (authentification, pages principales, etc.).
 * - Fournit les contextes globaux (thème, authentification) à toute l'application.
 * - Utilise MainLayout pour les pages nécessitant une authentification.
 * - Gère le routage conditionnel (routes publiques/protégées).
 * Dépendances :
 * - react-router-dom : pour la navigation et la protection des routes.
 * - ThemeProvider, AuthProvider : contextes globaux pour le thème et l'authentification.
 * - MainLayout, pages et formulaires d'authentification.
 * - ThemeToggle, Toaster : UI globale.
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard, PublicRoute } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { Toaster } from 'sonner';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import FriendsPage from './pages/FriendsPage';
import TestPage from './pages/TestPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Public auth routes */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginForm />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterForm />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPasswordForm />
              </PublicRoute>
            } />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            
            {/* Protected routes with MainLayout */}
            <Route path="/" element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }>
              <Route path="/home" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/groups" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Groups</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/pages" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Pages</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/ai-assistant" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">AI Assistant</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/help" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Help</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/support" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Support</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/contact" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Contact</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/feedback" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Feedback</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
              <Route path="/language" element={<div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Language</h2><p className="text-muted-foreground">Cette fonctionnalité arrive bientôt !</p></div></div>} />
            </Route>
          </Routes>
          <ThemeToggle />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
