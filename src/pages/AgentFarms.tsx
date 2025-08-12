import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import AgentFarmView from '@/components/Agent/AgentFarmView';

const AgentFarms: React.FC = () => {
  return (
    <MainLayout>
      <AgentFarmView />
    </MainLayout>
  );
};

export default AgentFarms;