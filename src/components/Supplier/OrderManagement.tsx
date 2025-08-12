
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, Calendar, MapPin, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  order_date: string;
  status: string;
  total_price: number;
  total_quantity: number;
  delivery_address: string;
  delivery_date: string | null;
  payment_method: string | null;
  is_credit: boolean;
  farms: {
    name: string;
  } | null;
  profiles: {
    name: string;
    phone: string;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    products: {
      name: string;
      unit: string;
    } | null;
  }> | null;
}

const OrderManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          farms(name),
          profiles(name, phone),
          order_items(
            id,
            quantity,
            unit_price,
            products(name, unit)
          )
        `)
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          ...(newStatus === 'delivered' && { delivery_date: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}.`,
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800', label: 'Processing' },
      shipped: { color: 'bg-orange-100 text-orange-800', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Manage incoming orders and track deliveries</p>
          </div>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-center">
              {filter === 'all' 
                ? "You haven't received any orders yet." 
                : `No ${filter} orders found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">${order.total_price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Customer</span>
                    </div>
                    <p className="text-sm text-gray-600">{order.profiles?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{order.profiles?.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Farm: {order.farms?.name || 'N/A'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Delivery Address</span>
                    </div>
                    <p className="text-sm text-gray-600">{order.delivery_address}</p>
                    {order.delivery_date && (
                      <p className="text-sm text-gray-600">
                        Delivered: {new Date(order.delivery_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Order Items</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-sm">{item.products?.name || 'Unknown Product'}</span>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.products?.unit || 'units'} × ${item.unit_price?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {order.is_credit ? 'Credit Order' : order.payment_method || 'Not specified'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      </>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                      >
                        Start Processing
                      </Button>
                    )}
                    
                    {order.status === 'processing' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                      >
                        Mark as Shipped
                      </Button>
                    )}
                    
                    {order.status === 'shipped' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
