import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';
import { showSuccess, showError } from '@/components/ui/toast';

type User = {
  username: string;
  email: string;
  avatar?: string;
};

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const EditProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
      setRemoveAvatar(false); // Reset remove flag when new file is selected
    }
  };

  const handleRemoveAvatar = () => {
    setRemoveAvatar(true);
    setAvatar(null); // Clear any selected file
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (username && username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
    }

    if (email && !validateEmail(email)) {
      errors.email = "Adresse email invalide.";
    }

    // Validation du mot de passe seulement s'il est renseigné
    if (password) {
      if (password.length < 8) {
        errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas.";
      }
    }

    // Si un mot de passe est renseigné, la confirmation est obligatoire
    if (password && !confirmPassword) {
      errors.confirmPassword = "Veuillez confirmer votre mot de passe.";
    }

    // Si seulement la confirmation est renseignée sans le mot de passe
    if (!password && confirmPassword) {
      errors.password = "Veuillez saisir le nouveau mot de passe.";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (username && username !== user?.username) formData.append('username', username);
      if (email && email !== user?.email) formData.append('email', email);
      if (avatar) formData.append('avatar', avatar);
      if (removeAvatar) formData.append('removeAvatar', 'true');
      // Envoyer le mot de passe seulement s'il est valide (8+ caractères et correspondant)
      if (password && password.length >= 8 && password === confirmPassword) {
        formData.append('password', password);
      }

      const response = await api.put('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Handle token update if provided
      if (response.data?.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        // Only try to login if we have both email and password
        if ((email || user?.email) && password) {
          await login(email || user?.email || '', password);
        }
      }

      setSuccess('Profil mis à jour avec succès !');
      showSuccess('Profil mis à jour avec succès !');
      setTimeout(() => {
        window.location.href = '../home';
      }, 1200);
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      let errorMessage = 'Erreur lors de la mise à jour du profil';

      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as { response?: { data?: { message?: string }; status?: number } };
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.status === 500) {
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    navigate('../home');
  };
  return (
    <form className="bg-card p-8 rounded-lg shadow-lg w-full max-w-full" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4 text-foreground text-center">Modifier mon profil</h2>
      {/* {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>} */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Nom d'utilisateur</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Nouveau nom d'utilisateur"
        />
        {fieldErrors.username && <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Adresse email</label>
        <input
          type="email"
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Nouvelle adresse email"
        />
        {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-muted-foreground">Avatar</label>

        {/* File input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="w-full mb-3 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all"
        />

        {/* Current avatar display */}
        {user?.avatar && !removeAvatar && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}`}
              alt="Avatar actuel"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Photo actuelle</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}

        {/* Removed avatar state */}
        {removeAvatar && (
          <div className="flex items-center gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Aucune</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-600">Photo supprimée</p>
            </div>
            <button
              type="button"
              onClick={() => setRemoveAvatar(false)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Annuler
            </button>
          </div>
        )}

        {/* New file selected indicator */}
        {avatar && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">Nouvelle photo sélectionnée: {avatar.name}</p>
          </div>
        )}
      </div>
      <div className="mb-4 flex gap-4 flex-col w-full">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-muted-foreground">Nouveau mot de passe</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground pr-10"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
          />
          <button
            type="button"
            className="absolute right-3 top-[34px] text-muted-foreground"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
          {password && password.length < 8 && (
            <p className="text-orange-500 text-xs mt-1">Le mot de passe doit contenir au moins 8 caractères</p>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-muted-foreground">Confirmer le mot de passe</label>
          <input
            type={showConfirm ? 'text' : 'password'}
            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground pr-10"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Répéter le nouveau mot de passe"
          />
          <button
            type="button"
            className="absolute right-3 top-[34px] text-muted-foreground"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-orange-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
          )}
        </div>
      </div>
      <div className="flex gap-4 max-w-sm mx-start">
        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
        <button
          type="button"
          className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
          onClick={handleCancel}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;