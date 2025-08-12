
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import InventoryManagement from '@/components/Farmer/InventoryManagement';

const FarmerInventory: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <InventoryManagement />
      </div>
    </MainLayout>
  );
};

export default FarmerInventory;
