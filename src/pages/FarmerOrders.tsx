
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import OrderPlacement from '@/components/Farmer/OrderPlacement';
import OrderHistory from '@/components/Farmer/OrderHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock } from 'lucide-react';

const FarmerOrders: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-600">Place new orders and track existing ones</p>
        </div>

        <Tabs defaultValue="place-order" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="place-order" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Place Order
            </TabsTrigger>
            <TabsTrigger value="order-history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Order History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="place-order" className="mt-6">
            <OrderPlacement />
          </TabsContent>
          
          <TabsContent value="order-history" className="mt-6">
            <OrderHistory />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default FarmerOrders;
