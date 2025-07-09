/**
 * Fichier : client/src/components/auth/ForgotPasswordForm.tsx
 * Rôle : Composant de formulaire pour la réinitialisation du mot de passe.
 * - Gère l'état du formulaire (email, chargement, succès)
 * - Appelle la fonction forgotPassword du contexte d'authentification
 * - Affiche des messages de succès ou d'erreur
 * - Permet de réinitialiser le formulaire
 * Dépendances :
 * - React pour la gestion du composant
 * - React Router pour la navigation
 * - AuthContext pour la gestion de l'authentification
 * - Sonner pour les notifications
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
      setEmail(''); // Reset form
      toast.success('Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'envoi des instructions';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setEmail('');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Email envoyé !
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.
              Vérifiez votre boîte de réception et vos spams.
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={handleReset}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
              Envoyer un autre email
            </button>
            <div className="text-center">
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Réinitialisation du mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Entrez votre adresse email pour recevoir les instructions de réinitialisation
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer les instructions'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 