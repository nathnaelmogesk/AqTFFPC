
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FarmManagement from '@/components/Farmer/FarmManagement';

const FarmerFarms: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <FarmManagement />
      </div>
    </MainLayout>
  );
};

export default FarmerFarms;
