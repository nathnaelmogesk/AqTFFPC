
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  suppliers: {
    name: string;
    contact_name: string;
  };
  farms: {
    name: string;
    location: string;
  };
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    status: string;
    products: {
      name: string;
      unit: string;
    };
  }[];
}

const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          suppliers!inner(name, contact_name),
          farms!inner(name, location),
          order_items(
            id,
            quantity,
            unit_price,
            status,
            products!inner(name, unit)
          )
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Order History</h3>
        <p className="text-gray-600">Track your feed orders and delivery status</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Your order history will appear here once you place your first order.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Orders ({orders.length})</CardTitle>
            <CardDescription>View and track all your feed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(order.order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.suppliers.name}</TableCell>
                    <TableCell>{order.farms.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      RWF {order.total_price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Order ID</p>
                                  <p className="font-mono">{selectedOrder.id}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Status</p>
                                  <Badge className={getStatusColor(selectedOrder.status)}>
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(selectedOrder.status)}
                                      {selectedOrder.status}
                                    </div>
                                  </Badge>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Supplier</p>
                                  <p>{selectedOrder.suppliers.name}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Farm</p>
                                  <p>{selectedOrder.farms.name}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Order Date</p>
                                  <p>{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Total Amount</p>
                                  <p className="font-medium">RWF {selectedOrder.total_price.toLocaleString()}</p>
                                </div>
                              </div>

                              <div>
                                <p className="font-medium text-sm text-gray-600 mb-2">Delivery Address</p>
                                <p>{selectedOrder.delivery_address}</p>
                              </div>

                              {selectedOrder.delivery_date && (
                                <div>
                                  <p className="font-medium text-sm text-gray-600">Expected Delivery</p>
                                  <p>{new Date(selectedOrder.delivery_date).toLocaleDateString()}</p>
                                </div>
                              )}

                              <div>
                                <p className="font-medium text-sm text-gray-600 mb-2">Order Items</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Unit Price</TableHead>
                                      <TableHead>Total</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedOrder.order_items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.products.name}</TableCell>
                                        <TableCell>{item.quantity} {item.products.unit}</TableCell>
                                        <TableCell>RWF {item.unit_price.toLocaleString()}</TableCell>
                                        <TableCell>RWF {(item.quantity * item.unit_price).toLocaleString()}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={getStatusColor(item.status)}>
                                            {item.status}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderHistory;
