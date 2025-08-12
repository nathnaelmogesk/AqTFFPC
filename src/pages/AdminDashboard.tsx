
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/Admin/UserManagement';
import FarmerAgentManagement from '@/components/Admin/FarmerAgentManagement';
import SystemReports from '@/components/Admin/SystemReports';
import SupplierApproval from '@/components/Admin/SupplierApproval';
import ProductManagement from '@/components/Admin/ProductManagement';
import OrderManagement from '@/components/Admin/OrderManagement';
import FarmManagement from '@/components/Admin/FarmManagement';
import SystemSettings from '@/components/Admin/SystemSettings';

const AdminDashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Comprehensive system administration and management</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="farms">Farms</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <FarmerAgentManagement />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierApproval />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="farms">
            <FarmManagement />
          </TabsContent>

          <TabsContent value="reports">
            <SystemReports />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
