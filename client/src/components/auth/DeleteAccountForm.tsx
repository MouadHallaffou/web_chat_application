import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Trash2, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';
import { showSuccess, showError } from '@/components/ui/toast';

interface DeleteAccountProps {
    onCancel: () => void;
}

const DeleteAccountForm: React.FC<DeleteAccountProps> = ({ onCancel }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [reason, setReason] = useState('');
    const [feedback, setFeedback] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const deleteReasons = [
        'Je n\'utilise plus l\'application',
        'J\'ai trouvé une alternative',
        'Problèmes de confidentialité',
        'Interface trop compliquée',
        'Fonctionnalités insuffisantes',
        'Problèmes techniques récurrents',
        'Autre'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason) {
            showError('Veuillez sélectionner une cause de suppression');
            return;
        }

        if (!password) {
            showError('Veuillez saisir votre mot de passe pour confirmer');
            return;
        }

        if (!confirmed) {
            showError('Veuillez confirmer que vous comprenez les conséquences');
            return;
        }

        setIsLoading(true);

        try {
            await api.delete('/profile/delete', {
                data: {
                    reason,
                    feedback: feedback.trim() || undefined,
                    password
                }
            });

            showSuccess('Votre compte a été supprimé avec succès');

            // Déconnexion et redirection
            setTimeout(async () => {
                await logout();
                navigate('/login');
            }, 1500);

        } catch (error: unknown) {
            let errorMessage = 'Erreur lors de la suppression du compte';

            if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response?: { data?: { message?: string } } };
                if (apiError.response?.data?.message) {
                    errorMessage = apiError.response.data.message;
                }
            }

            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Supprimer le compte</h2>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">Attention !</h3>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Cette action est irréversible. Toutes vos données (messages, contacts, paramètres)
                                    seront définitivement supprimées.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Reason selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Pourquoi supprimez-vous votre compte ? *
                            </label>
                            <div className="space-y-2">
                                {deleteReasons.map((reasonOption) => (
                                    <label
                                        key={reasonOption}
                                        className="flex items-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={reasonOption}
                                            checked={reason === reasonOption}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="mr-3 text-red-600 dark:text-red-400"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{reasonOption}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Commentaires (optionnel)
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                rows={3}
                                placeholder="Aidez-nous à améliorer notre service..."
                            />
                        </div>

                        {/* Password confirmation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirmez avec votre mot de passe *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Votre mot de passe"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmation checkbox */}
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="confirm"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="mt-1 text-red-600 dark:text-red-400"
                            />
                            <label htmlFor="confirm" className="text-sm text-gray-700 dark:text-gray-300">
                                Je comprends que cette action supprimera définitivement mon compte et toutes mes données,
                                et qu'elle ne peut pas être annulée.
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                disabled={isLoading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !reason || !password || !confirmed}
                                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    'Suppression...'
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer définitivement
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountForm;
