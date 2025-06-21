import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Eye, EyeOff } from 'lucide-react';
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
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (username && username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
    }
    if (email && !validateEmail(email)) {
      errors.email = "Adresse email invalide.";
    }
    if (password && password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }
    if (password && password !== confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
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
      if (password) formData.append('password', password);
      const response = await api.put('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        await login(email || user?.email || '', password || undefined);
      }
      setSuccess('Profil mis à jour avec succès !');
      showSuccess('Profil mis à jour avec succès !');
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1200);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  return (
    <form className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4 text-foreground">Modifier mon profil</h2>
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
      <div className="mb-4 flex items-center gap-0">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-muted-foreground">Avatar</label>
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>
        {user?.avatar && (
          <img
            src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}`}
            alt="Ancien avatar"
            className="w-8 h-8 rounded-full object-cover border"
          />
        )}
      </div>
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Nouveau mot de passe</label>
        <input
          type={showPassword ? 'text' : 'password'}
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground pr-10"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Laisser vide pour ne pas changer"
        />
        <button
          type="button"
          className="absolute right-3 top-8 text-muted-foreground"
          tabIndex={-1}
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
      </div>
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Confirmer le mot de passe</label>
        <input
          type={showConfirm ? 'text' : 'password'}
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground pr-10"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Laisser vide pour ne pas changer"
        />
        <button
          type="button"
          className="absolute right-3 top-8 text-muted-foreground"
          tabIndex={-1}
          onClick={() => setShowConfirm((v) => !v)}
        >
          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
      </div>
      <div className="flex gap-4">
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