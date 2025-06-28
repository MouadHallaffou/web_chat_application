import React from 'react';
import EditProfileForm from '@/components/auth/EditProfileForm';

const SettingsPage = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-background custom-scrollbar overflow-y-auto">
      <EditProfileForm />
    </div>
  );
};

export default SettingsPage; 