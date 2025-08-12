
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package2, Truck, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface OrderBatch {
  id: string;
  batch_name: string;
  status: string;
  dispatch_date: string | null;
  expected_delivery_date: string | null;
  total_orders: number;
  created_at: string;
  order_batch_items: Array<{
    orders: {
      id: string;
      total_price: number;
      delivery_address: string;
      profiles: {
        name: string;
      };
    };
  }>;
}

const BatchManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState<OrderBatch[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    batch_name: '',
    dispatch_date: '',
    expected_delivery_date: '',
    selected_orders: [] as string[]
  });

  useEffect(() => {
    fetchBatches();
    fetchAvailableOrders();
  }, [user]);

  const fetchBatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('order_batches')
        .select(`
          *,
          order_batch_items(
            orders(
              id,
              total_price,
              delivery_address,
              profiles(name)
            )
          )
        `)
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order batches.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableOrders = async () => {
    if (!user) return;

    try {
      // Get orders that are confirmed but not yet in any batch
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_price,
          delivery_address,
          profiles(name)
        `)
        .eq('supplier_id', user.id)
        .eq('status', 'confirmed')
        .not('id', 'in', `(SELECT order_id FROM order_batch_items)`);

      if (error) throw error;
      setAvailableOrders(data || []);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || formData.selected_orders.length === 0) return;

    try {
      // Create the batch
      const { data: batchData, error: batchError } = await supabase
        .from('order_batches')
        .insert({
          supplier_id: user.id,
          batch_name: formData.batch_name,
          dispatch_date: formData.dispatch_date || null,
          expected_delivery_date: formData.expected_delivery_date || null,
          total_orders: formData.selected_orders.length
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Add orders to the batch
      const batchItems = formData.selected_orders.map(orderId => ({
        batch_id: batchData.id,
        order_id: orderId
      }));

      const { error: itemsError } = await supabase
        .from('order_batch_items')
        .insert(batchItems);

      if (itemsError) throw itemsError;

      // Update order status to processing
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .in('id', formData.selected_orders);

      if (orderUpdateError) throw orderUpdateError;

      toast({
        title: "Batch Created",
        description: `Order batch "${formData.batch_name}" created successfully.`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchBatches();
      fetchAvailableOrders();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: "Error",
        description: "Failed to create order batch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateBatchStatus = async (batchId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'dispatched') {
        updates.dispatch_date = new Date().toISOString();
        
        // Update all orders in this batch to shipped
        const { data: batchItems } = await supabase
          .from('order_batch_items')
          .select('order_id')
          .eq('batch_id', batchId);

        if (batchItems) {
          const orderIds = batchItems.map(item => item.order_id);
          await supabase
            .from('orders')
            .update({ status: 'shipped' })
            .in('id', orderIds);
        }
      }

      const { error } = await supabase
        .from('order_batches')
        .update(updates)
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: "Batch Updated",
        description: `Batch status updated to ${newStatus}.`,
      });

      fetchBatches();
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: "Error",
        description: "Failed to update batch status.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      batch_name: '',
      dispatch_date: '',
      expected_delivery_date: '',
      selected_orders: []
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      preparing: { color: 'bg-yellow-100 text-yellow-800', label: 'Preparing' },
      dispatched: { color: 'bg-blue-100 text-blue-800', label: 'Dispatched' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preparing;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_orders: checked
        ? [...prev.selected_orders, orderId]
        : prev.selected_orders.filter(id => id !== orderId)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package2 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
            <p className="text-gray-600">Group orders for efficient dispatch and logistics</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={availableOrders.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch_name">Batch Name</Label>
                <Input
                  id="batch_name"
                  value={formData.batch_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_name: e.target.value }))}
                  placeholder="Enter batch name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dispatch_date">Dispatch Date</Label>
                  <Input
                    id="dispatch_date"
                    type="datetime-local"
                    value={formData.dispatch_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, dispatch_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                  <Input
                    id="expected_delivery_date"
                    type="datetime-local"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Orders ({availableOrders.length} available)</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`order-${order.id}`}
                        checked={formData.selected_orders.includes(order.id)}
                        onChange={(e) => handleOrderSelection(order.id, e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor={`order-${order.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">#{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">{order.profiles.name}</p>
                            <p className="text-xs text-gray-500">{order.delivery_address}</p>
                          </div>
                          <span className="font-bold text-green-600">${order.total_price.toFixed(2)}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formData.selected_orders.length === 0}>
                  Create Batch ({formData.selected_orders.length} orders)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches created</h3>
            <p className="text-gray-500 text-center mb-4">
              Create order batches to efficiently manage your dispatches and logistics.
            </p>
            {availableOrders.length > 0 && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Batch
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">{batch.batch_name}</CardTitle>
                    {getStatusBadge(batch.status)}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{batch.total_orders} orders</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(batch.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batch.dispatch_date && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Dispatch Date</p>
                        <p className="text-sm text-gray-600">
                          {new Date(batch.dispatch_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {batch.expected_delivery_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Expected Delivery</p>
                        <p className="text-sm text-gray-600">
                          {new Date(batch.expected_delivery_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {batch.order_batch_items.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">Orders in this batch:</p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {batch.order_batch_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">#{item.orders.id.slice(-8)}</span>
                            <span className="text-gray-600 ml-2">{item.orders.profiles.name}</span>
                          </div>
                          <span className="text-green-600 font-medium">
                            ${item.orders.total_price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  {batch.status === 'preparing' && (
                    <Button 
                      size="sm"
                      onClick={() => updateBatchStatus(batch.id, 'dispatched')}
                    >
                      Mark as Dispatched
                    </Button>
                  )}
                  
                  {batch.status === 'dispatched' && (
                    <Button 
                      size="sm"
                      onClick={() => updateBatchStatus(batch.id, 'delivered')}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
