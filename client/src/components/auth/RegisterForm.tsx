import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess, showError } from '@/components/ui/toast';
import { motion } from 'framer-motion';
import SocialLogin from './SocialLogin';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

const passwordHelp = "Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule, un chiffre et un symbole.";

const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
  email: z.string().email('Adresse email invalide.'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
      'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un symbole.'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});

const RegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordValue = watch('password');

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await register(data.username, data.email, data.password);
      showSuccess('Inscription réussie !');
      navigate('/login');
    } catch (err: Error | unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showError(error.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPassword(prev => !prev);
  };

  const toggleConfirmVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowConfirm(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 bg-card p-6 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Ou{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>
        
        <form className="mt-2 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`
                  appearance-none rounded-lg block w-full px-2 py-2 
                  border bg-background text-foreground 
                  placeholder-muted-foreground 
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-colors duration-200
                  ${errors.username && touchedFields.username 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-input hover:border-ring/50'
                  }
                `}
                placeholder="Entrez votre nom d'utilisateur"
                {...formRegister('username')}
              />
              {errors.username && touchedFields.username && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.username.message as string}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`
                  appearance-none rounded-lg block w-full px-2 py-2 
                  border bg-background text-foreground 
                  placeholder-muted-foreground 
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-colors duration-200
                  ${errors.email && touchedFields.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-input hover:border-ring/50'
                  }
                `}
                placeholder="Entrez votre adresse email"
                {...formRegister('email')}
              />
              {errors.email && touchedFields.email && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`
                    appearance-none rounded-lg block w-full px-2 py-2 pr-12
                    border bg-background text-foreground 
                    placeholder-muted-foreground 
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    transition-colors duration-200
                    ${errors.password && touchedFields.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-input hover:border-ring/50'
                    }
                  `}
                  placeholder="Entrez votre mot de passe"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  {...formRegister('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-muted-foreground hover:text-foreground 
                           focus:outline-none focus:text-foreground
                           transition-colors duration-200
                           p-1 rounded"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {(passwordFocused || passwordValue) && (
                <p className="text-sm text-muted-foreground mt-2">
                  {passwordHelp}
                </p>
              )}
              
              {errors.password && touchedFields.password && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.password.message as string}
                </p>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`
                    appearance-none rounded-lg block w-full px-2 py-2 pr-12
                    border bg-background text-foreground 
                    placeholder-muted-foreground 
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    transition-colors duration-200
                    ${errors.confirmPassword && touchedFields.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-input hover:border-ring/50'
                    }
                  `}
                  placeholder="Confirmez votre mot de passe"
                  {...formRegister('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-muted-foreground hover:text-foreground 
                           focus:outline-none focus:text-foreground
                           transition-colors duration-200
                           p-1 rounded"
                  onClick={toggleConfirmVisibility}
                  aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {errors.confirmPassword && touchedFields.confirmPassword && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.confirmPassword.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 
                       border border-transparent text-sm font-medium rounded-lg 
                       text-primary-foreground bg-primary hover:bg-primary/90 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors duration-200"
            >
              {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </div>
        </form>

        <SocialLogin />
      </div>
    </div>
  );
};

export default RegisterForm;