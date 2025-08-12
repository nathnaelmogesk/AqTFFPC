import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const OrderAggregation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Fetch orders with details
  const { data: orders, isLoading } = useQuery({
    queryKey: ['agent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_price,
          total_quantity,
          status,
          delivery_date,
          payment_method,
          is_credit,
          profiles!orders_farmer_id_fkey(name, phone),
          farms(name, location),
          suppliers!orders_supplier_id_fkey(name),
          order_items(
            id,
            quantity,
            unit_price,
            products(name, unit)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch order statistics
  const { data: orderStats } = useQuery({
    queryKey: ['agent-order-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Monthly stats
      const { data: monthlyOrders, error: monthlyError } = await supabase
        .from('orders')
        .select('total_price, status')
        .gte('created_at', startOfMonth.toISOString());
      
      if (monthlyError) throw monthlyError;

      // Weekly stats
      const { data: weeklyOrders, error: weeklyError } = await supabase
        .from('orders')
        .select('total_price, status')
        .gte('created_at', startOfWeek.toISOString());
      
      if (weeklyError) throw weeklyError;

      // Status counts
      const statusCounts = orders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      const weeklyRevenue = weeklyOrders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

      return {
        total: orders?.length || 0,
        monthly: monthlyOrders?.length || 0,
        weekly: weeklyOrders?.length || 0,
        monthlyRevenue,
        weeklyRevenue,
        statusCounts
      };
    },
    enabled: !!orders
  });

  // Filter orders based on search and filters
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farms?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'shipped': return <Package className="w-4 h-4" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">Monitor and manage all orders in your region</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats?.total || 0}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{orderStats?.monthly || 0}</p>
                <p className="text-sm text-green-600">{formatCurrency(orderStats?.monthlyRevenue || 0)}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{orderStats?.weekly || 0}</p>
                <p className="text-sm text-blue-600">{formatCurrency(orderStats?.weeklyRevenue || 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{orderStats?.statusCounts?.pending || 0}</p>
                <p className="text-sm text-orange-600">Need Attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders, farmers, farms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>Detailed view of all orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                        <Badge className={getStatusBadgeClass(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </Badge>
                        {order.is_credit && (
                          <Badge variant="outline" className="text-blue-600">Credit</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Farmer:</strong> {order.profiles?.name}</p>
                          <p><strong>Farm:</strong> {order.farms?.name}</p>
                        </div>
                        <div>
                          <p><strong>Supplier:</strong> {order.suppliers?.name}</p>
                          <p><strong>Location:</strong> {order.farms?.location}</p>
                        </div>
                        <div>
                          <p><strong>Order Date:</strong> {formatDate(order.created_at)}</p>
                          {order.delivery_date && (
                            <p><strong>Delivery:</strong> {formatDate(order.delivery_date)}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Order Items Preview */}
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium mb-2">Items ({order.order_items?.length || 0}):</p>
                        <div className="text-sm text-gray-600">
                          {order.order_items?.slice(0, 3).map((item: any, index: number) => (
                            <span key={item.id}>
                              {item.products?.name} ({item.quantity} {item.products?.unit})
                              {index < Math.min(2, (order.order_items?.length || 1) - 1) && ', '}
                            </span>
                          ))}
                          {(order.order_items?.length || 0) > 3 && (
                            <span> and {(order.order_items?.length || 0) - 3} more...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-6">
                      <p className="text-lg font-bold">{formatCurrency(Number(order.total_price))}</p>
                      <p className="text-sm text-gray-600">{order.total_quantity} items</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No orders have been placed yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderAggregation;