import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import DemandForecastingDashboard from '@/components/Analytics/DemandForecastingDashboard';

const AnalyticsDashboard: React.FC = () => {
  return (
    <MainLayout>
      <DemandForecastingDashboard />
    </MainLayout>
  );
};

export default AnalyticsDashboard;