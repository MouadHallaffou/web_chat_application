import React, { useState } from 'react';
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
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError('');
      setIsLoading(true);
      const token = searchParams.get('token');
      if (!token) {
        throw new Error('Invalid reset token');
      }
      await resetPassword(token, data.password);
      showSuccess('Mot de passe réinitialisé avec succès !');
      navigate('/login');
    } catch (err: Error | unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
      showError(error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Reset Password</h2>
      {error && <Alert variant="destructive" className="mb-4 text-sm sm:text-base">{error}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
        <div className="relative">
          <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="New Password"
          {...register('password')}
          className={`${errors.password ? 'border-red-500' : ''} pr-10 text-sm sm:text-base`}
          />
          <button
          type="button"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          placeholder="Confirm New Password"
          {...register('confirmPassword')}
          className={`${errors.confirmPassword ? 'border-red-500' : ''} pr-10 text-sm sm:text-base`}
          />
          <button
          type="button"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          onClick={() => setShowConfirm((v) => !v)}
          aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
        {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
      </div>
    </div>
  );
}; 