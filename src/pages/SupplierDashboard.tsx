
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SupplierProfile from '@/components/Supplier/SupplierProfile';
import ProductCatalog from '@/components/Supplier/ProductCatalog';
import OrderManagement from '@/components/Supplier/OrderManagement';
import BatchManagement from '@/components/Supplier/BatchManagement';
import SalesAnalytics from '@/components/Supplier/SalesAnalytics';

const SupplierDashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600">Manage your feed supply business efficiently</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <SupplierProfile />
          </TabsContent>

          <TabsContent value="products">
            <ProductCatalog />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="batches">
            <BatchManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SupplierDashboard;
