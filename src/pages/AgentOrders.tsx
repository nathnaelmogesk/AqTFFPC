import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import OrderAggregation from '@/components/Agent/OrderAggregation';

const AgentOrders: React.FC = () => {
  return (
    <MainLayout>
      <OrderAggregation />
    </MainLayout>
  );
};

export default AgentOrders;