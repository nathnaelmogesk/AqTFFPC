
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardCard from '@/components/Dashboard/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  List, 
  Home,
  Bell,
  User,
  Folder,
  Mail,
  Plus,
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  farms: number;
  orders: number;
  lowStockAlerts: number;
  outstandingCredit: number;
  totalInventoryValue: number;
  pendingOrders: number;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    farms: 0,
    orders: 0,
    lowStockAlerts: 0,
    outstandingCredit: 0,
    totalInventoryValue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch farms count
      const { count: farmsCount } = await supabase
        .from('farms')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', user.id);

      // Fetch recent orders with supplier and farm info
      const { data: ordersData, count: ordersCount } = await supabase
        .from('orders')
        .select(`
          *,
          farms(name),
          suppliers(name),
          order_items(quantity, unit_price, products(name, unit))
        `, { count: 'exact' })
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch pending orders count
      const { count: pendingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', user.id)
        .in('status', ['pending', 'confirmed']);

      // Fetch outstanding loans
      const { data: loansData } = await supabase
        .from('loans')
        .select('outstanding_balance')
        .eq('farmer_id', user.id)
        .in('status', ['active', 'approved']);

      const totalCredit = loansData?.reduce((sum, loan) => sum + parseFloat(loan.outstanding_balance.toString()), 0) || 0;

      // Fetch low stock inventory items with value calculation
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select(`
          *,
          farms!inner(name, farmer_id),
          products(name, unit, unit_price)
        `)
        .eq('farms.farmer_id', user.id)
        .filter('current_stock', 'lt', 'low_stock_threshold');

      // Calculate total inventory value
      const { data: allInventory } = await supabase
        .from('inventory')
        .select(`
          current_stock,
          products(unit_price),
          farms!inner(farmer_id)
        `)
        .eq('farms.farmer_id', user.id);

      const totalInventoryValue = allInventory?.reduce((sum, item) => 
        sum + (item.current_stock * (item.products?.unit_price || 0)), 0
      ) || 0;

      // Fetch upcoming deliveries
      const { data: deliveriesData } = await supabase
        .from('orders')
        .select(`
          *,
          farms(name),
          suppliers(name)
        `)
        .eq('farmer_id', user.id)
        .not('delivery_date', 'is', null)
        .gte('delivery_date', new Date().toISOString())
        .order('delivery_date', { ascending: true })
        .limit(3);

      setStats({
        farms: farmsCount || 0,
        orders: ordersCount || 0,
        lowStockAlerts: inventoryData?.length || 0,
        outstandingCredit: totalCredit,
        totalInventoryValue,
        pendingOrders: pendingOrdersCount || 0
      });

      setRecentOrders(ordersData || []);
      setInventoryAlerts(inventoryData || []);
      setUpcomingDeliveries(deliveriesData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFarmerDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name || user?.email}!
          </h1>
          <p className="text-gray-600">Manage your farms, track inventory, and place orders</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => navigate('/orders')}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Place New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Active Farms"
          value={stats.farms.toString()}
          icon={Home}
          description="Registered farm locations"
          onClick={() => navigate('/farms')}
        />
        <DashboardCard
          title="Total Orders"
          value={stats.orders.toString()}
          icon={Calendar}
          description={`${stats.pendingOrders} pending`}
          onClick={() => navigate('/orders')}
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={stats.lowStockAlerts.toString()}
          changeType={stats.lowStockAlerts > 0 ? "negative" : "positive"}
          icon={Bell}
          description="Items need restocking"
          onClick={() => navigate('/inventory')}
        />
        <DashboardCard
          title="Inventory Value"
          value={`RWF ${stats.totalInventoryValue.toLocaleString()}`}
          icon={Package}
          description="Current stock value"
          onClick={() => navigate('/inventory')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest feed orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <Button onClick={() => navigate('/orders')} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Place First Order
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.farms?.name}</p>
                      <p className="text-sm text-gray-500">
                        {order.suppliers?.name} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.order_items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">RWF {order.total_price.toLocaleString()}</p>
                      <Badge variant={
                        order.status === 'delivered' ? 'default' : 
                        order.status === 'confirmed' ? 'secondary' : 
                        'outline'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">All inventory levels are good</p>
                <Button onClick={() => navigate('/inventory')} variant="outline" size="sm">
                  View Inventory
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {inventoryAlerts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border-l-4 border-red-400 bg-red-50 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="font-medium text-sm">{item.products?.name}</p>
                        <p className="text-xs text-gray-600">{item.farms?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{item.current_stock} {item.products?.unit}</p>
                      <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deliveries */}
      {upcomingDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Deliveries
            </CardTitle>
            <CardDescription>Your scheduled feed deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{delivery.farms?.name}</p>
                    <p className="text-sm text-gray-600">{delivery.suppliers?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Date(delivery.delivery_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      RWF {delivery.total_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Guide for New Users */}
      {stats.farms === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Get started with your first farm</h3>
                <p className="text-green-700">Add your farm details to start managing your feed inventory and orders.</p>
              </div>
              <Button onClick={() => navigate('/farms')} className="bg-green-600 hover:bg-green-700">
                Add Farm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Credit Alert */}
      {stats.outstandingCredit > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Outstanding Credit</h3>
                <p className="text-yellow-700">
                  You have RWF {stats.outstandingCredit.toLocaleString()} in outstanding credit balance.
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          getFarmerDashboard()
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
