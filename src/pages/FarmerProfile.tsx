
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ProfileForm from '@/components/Farmer/ProfileForm';

const FarmerProfile: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        <ProfileForm />
      </div>
    </MainLayout>
  );
};

export default FarmerProfile;
