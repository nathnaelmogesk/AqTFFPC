
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Package, ShoppingCart, TrendingUp, Download, Calendar } from 'lucide-react';

const SystemReports: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState('30');

  const { data: systemStats } = useQuery({
    queryKey: ['system-stats', reportPeriod],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(reportPeriod));

      // Get user counts by role
      const { data: userCounts } = await supabase
        .from('profiles')
        .select('role')
        .gte('created_at', daysAgo.toISOString());

      // Get order statistics
      const { data: orderStats } = await supabase
        .from('orders')
        .select('id, status, total_price, created_at')
        .gte('created_at', daysAgo.toISOString());

      // Get product counts
      const { data: productCounts } = await supabase
        .from('products')
        .select('id, category, availability_status');

      // Get supplier counts
      const { data: supplierCounts } = await supabase
        .from('suppliers')
        .select('id, is_active');

      return {
        userCounts: userCounts || [],
        orderStats: orderStats || [],
        productCounts: productCounts || [],
        supplierCounts: supplierCounts || [],
      };
    },
  });

  const userRoleData = systemStats?.userCounts.reduce((acc: any, user) => {
    const role = user.role || 'farmer';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = userRoleData ? Object.entries(userRoleData).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: count,
  })) : [];

  const orderStatusData = systemStats?.orderStats.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = orderStatusData ? Object.entries(orderStatusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  })) : [];

  const totalRevenue = systemStats?.orderStats
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

  const activeSuppliers = systemStats?.supplierCounts.filter(s => s.is_active).length || 0;
  const totalProducts = systemStats?.productCounts.length || 0;

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Reports</h2>
          <p className="text-gray-600">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="flex gap-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.userCounts.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.orderStats.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Orders in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From delivered orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Verified and active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
            <CardDescription>
              Breakdown of users by their assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>
              Current status of orders in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
          <CardDescription>
            Key performance indicators and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Products Available</span>
                <Badge variant="secondary">{totalProducts}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Active Suppliers</span>
                <Badge variant="secondary">{activeSuppliers}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Pending Orders</span>
                <Badge variant="secondary">
                  {orderStatusData?.pending || 0}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Completed Orders</span>
                <Badge className="bg-green-100 text-green-800">
                  {orderStatusData?.delivered || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Processing Orders</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {orderStatusData?.processing || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cancelled Orders</span>
                <Badge className="bg-red-100 text-red-800">
                  {orderStatusData?.cancelled || 0}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Farmers</span>
                <Badge variant="outline">{userRoleData?.farmer || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Agents</span>
                <Badge variant="outline">{userRoleData?.agent || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">System Admins</span>
                <Badge variant="outline">{userRoleData?.admin || 0}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReports;
