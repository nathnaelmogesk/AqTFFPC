import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardCard from '@/components/Dashboard/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch agent statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      // Get farmers count
      const { data: farmersData, error: farmersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'farmer');
      
      if (farmersError) throw farmersError;

      // Get farms count
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('id');
      
      if (farmsError) throw farmsError;

      // Get orders count for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, status')
        .gte('created_at', startOfMonth.toISOString());
      
      if (ordersError) throw ordersError;

      // Get inventory items with low stock
      const { data: lowStockData, error: lowStockError } = await supabase
        .from('inventory')
        .select('id, current_stock, low_stock_threshold')
        .lt('current_stock', 'low_stock_threshold');
      
      if (lowStockError) throw lowStockError;

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;

      return {
        totalFarmers: farmersData?.length || 0,
        totalFarms: farmsData?.length || 0,
        monthlyOrders: ordersData?.length || 0,
        monthlyRevenue: totalRevenue,
        pendingOrders,
        lowStockItems: lowStockData?.length || 0
      };
    }
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['agent-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_price,
          status,
          profiles!orders_farmer_id_fkey(name),
          farms(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent farmers
  const { data: recentFarmers, isLoading: farmersLoading } = useQuery({
    queryKey: ['agent-recent-farmers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, created_at, phone, address')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Monitor farmers, farms, and orders across your region</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <DashboardCard 
            title="Total Farmers" 
            value={statsLoading ? "..." : stats?.totalFarmers?.toString() || "0"}
            icon={Users} 
            description="Active farmers"
          />
          <DashboardCard 
            title="Total Farms" 
            value={statsLoading ? "..." : stats?.totalFarms?.toString() || "0"}
            icon={Building2} 
            description="Registered farms"
          />
          <DashboardCard 
            title="Monthly Orders" 
            value={statsLoading ? "..." : stats?.monthlyOrders?.toString() || "0"}
            icon={ShoppingCart} 
            description="This month"
          />
          <DashboardCard 
            title="Monthly Revenue" 
            value={statsLoading ? "..." : formatCurrency(stats?.monthlyRevenue || 0)}
            icon={TrendingUp} 
            description="This month"
          />
          <DashboardCard 
            title="Pending Orders" 
            value={statsLoading ? "..." : stats?.pendingOrders?.toString() || "0"}
            icon={AlertTriangle} 
            description="Needs attention"
          />
          <DashboardCard 
            title="Low Stock Items" 
            value={statsLoading ? "..." : stats?.lowStockItems?.toString() || "0"}
            icon={AlertTriangle} 
            description="Critical levels"
          />
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="farmers">Recent Farmers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from farmers in your region</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : recentOrders && recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{order.profiles?.name}</p>
                              <p className="text-sm text-gray-600">{order.farms?.name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Order #{order.id.slice(0, 8)} • {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(order.total_price))}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent orders found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="farmers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Farmers</CardTitle>
                <CardDescription>Newly registered farmers in your region</CardDescription>
              </CardHeader>
              <CardContent>
                {farmersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : recentFarmers && recentFarmers.length > 0 ? (
                  <div className="space-y-4">
                    {recentFarmers.map((farmer: any) => (
                      <div key={farmer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{farmer.name}</p>
                            <p className="text-sm text-gray-600">{farmer.phone}</p>
                            <p className="text-sm text-gray-500">{farmer.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Joined</p>
                          <p className="text-sm font-medium">{formatDate(farmer.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent farmers found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AgentDashboard;