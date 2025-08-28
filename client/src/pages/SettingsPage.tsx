import React, { useState } from 'react';
import EditProfileForm from '@/components/auth/EditProfileForm';
import DeleteAccountForm from '@/components/auth/DeleteAccountForm';
import { Trash2, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  return (
    <div className="flex-1 bg-background custom-scrollbar overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Paramètres du compte</h1>
          <p className="text-muted-foreground">Gérez votre profil et vos préférences</p>
        </div>

        {/* Profile Edit Section */}
        <div className="bg-card rounded-lg shadow-sm">
          <EditProfileForm />
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Zone de danger</h3>
          </div>

          <p className="text-red-700 text-sm mb-4">
            La suppression de votre compte est une action irréversible. Toutes vos données seront définitivement perdues.
          </p>

          <button
            onClick={() => setShowDeleteForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </button>
        </div>

        {/* Delete Account Modal */}
        {showDeleteForm && (
          <DeleteAccountForm onCancel={() => setShowDeleteForm(false)} />
        )}
      </div>
    </div>
  );
};

export default SettingsPage; 