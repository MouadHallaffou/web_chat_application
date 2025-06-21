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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
      showError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="password"
            placeholder="New Password"
            {...register('password')}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        <div>
          <Input
            type="password"
            placeholder="Confirm New Password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}; 