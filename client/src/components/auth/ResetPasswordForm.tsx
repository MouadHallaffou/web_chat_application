import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert } from '../ui/alert';
import { showSuccess, showError } from '@/components/ui/toast';
import { Eye, EyeOff } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Vérifier le token au chargement
  useEffect(() => {
    console.log('ResetPasswordForm: useEffect triggered');
    console.log('Current pathname:', window.location.pathname);
    console.log('Current search:', window.location.search);
    
    const token = searchParams.get('token');
    console.log('Token from search params:', token);
    
    if (!token) {
      console.log('No token found, setting isValidToken to false');
      setError('Token de réinitialisation manquant ou invalide');
      setIsValidToken(false);
    } else {
      console.log('Token found, setting isValidToken to true');
      setIsValidToken(true);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError('');
      setIsLoading(true);
      const token = searchParams.get('token');
      
      if (!token) {
        throw new Error('Token de réinitialisation manquant');
      }

      await resetPassword(token, data.password);
      showSuccess('Mot de passe réinitialisé avec succès !');
      reset(); // Reset form
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la réinitialisation du mot de passe';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Si le token est invalide, afficher un message d'erreur
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Token invalide</h2>
            <p className="text-muted-foreground mb-6">
              Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
            </p>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Demander un nouveau lien
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si on vérifie encore le token, afficher un loader
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Réinitialiser le mot de passe</h2>
        {error && <Alert variant="destructive" className="mb-4 text-sm sm:text-base">{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nouveau mot de passe"
                {...register('password')}
                className={`${errors.password ? 'border-red-500' : ''} pr-10 text-sm sm:text-base`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs sm:text-sm px-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmer le nouveau mot de passe"
                {...register('confirmPassword')}
                className={`${errors.confirmPassword ? 'border-red-500' : ''} pr-10 text-sm sm:text-base`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirm ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs sm:text-sm px-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-sm sm:text-base mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  );
}; 