import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import InventoryForecasting from '@/components/Analytics/InventoryForecasting';

const InventoryForecastingPage: React.FC = () => {
  return (
    <MainLayout>
      <InventoryForecasting />
    </MainLayout>
  );
};

export default InventoryForecastingPage;