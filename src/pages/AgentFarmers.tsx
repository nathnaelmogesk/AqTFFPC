import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FarmerManagement from '@/components/Agent/FarmerManagement';

const AgentFarmers: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmer Management</h1>
          <p className="text-gray-600">Manage and monitor farmers in your region</p>
        </div>
        <FarmerManagement />
      </div>
    </MainLayout>
  );
};

export default AgentFarmers;