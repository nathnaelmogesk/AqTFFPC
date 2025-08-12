
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, AlertTriangle, Edit, TrendingDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  farm_id: string;
  product_id: string;
  current_stock: number;
  low_stock_threshold: number;
  average_monthly_consumption: number;
  feed_frequency: number;
  feed_frequency_unit: string;
  last_order_date: string | null;
  farms: { name: string };
  products: { 
    name: string; 
    unit: string; 
    feed_type: string;
    suppliers: { name: string };
  };
}

interface Farm {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  feed_type: string;
  suppliers: { name: string };
}

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState({
    farm_id: '',
    product_id: '',
    current_stock: '',
    low_stock_threshold: '',
    average_monthly_consumption: '',
    feed_frequency: '',
    feed_frequency_unit: 'daily'
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch inventory with related data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          *,
          farms!inner(name, farmer_id),
          products(
            name,
            unit,
            feed_type,
            suppliers(name)
          )
        `)
        .eq('farms.farmer_id', user.id);

      if (inventoryError) throw inventoryError;

      // Fetch user's farms
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('id, name')
        .eq('farmer_id', user.id);

      if (farmsError) throw farmsError;

      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          unit,
          feed_type,
          suppliers(name)
        `);

      if (productsError) throw productsError;

      setInventory(inventoryData || []);
      setFarms(farmsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const inventoryData = {
        farm_id: formData.farm_id,
        product_id: formData.product_id,
        current_stock: parseFloat(formData.current_stock),
        low_stock_threshold: parseFloat(formData.low_stock_threshold),
        average_monthly_consumption: parseFloat(formData.average_monthly_consumption),
        feed_frequency: parseInt(formData.feed_frequency),
        feed_frequency_unit: formData.feed_frequency_unit,
        last_updated_by: user.id,
        last_updated_at: new Date().toISOString()
      };

      let error;
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('id', editingItem.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('inventory')
          .insert([inventoryData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingItem ? "Inventory Updated" : "Inventory Added",
        description: "Inventory has been successfully updated.",
      });

      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      farm_id: item.farm_id,
      product_id: item.product_id,
      current_stock: item.current_stock.toString(),
      low_stock_threshold: item.low_stock_threshold?.toString() || '',
      average_monthly_consumption: item.average_monthly_consumption?.toString() || '',
      feed_frequency: item.feed_frequency?.toString() || '',
      feed_frequency_unit: item.feed_frequency_unit || 'daily'
    });
    setIsDialogOpen(true);
  };

  const updateStock = async (itemId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          current_stock: newStock,
          last_updated_at: new Date().toISOString(),
          last_updated_by: user?.id
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Stock Updated",
        description: "Stock level has been updated successfully.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      farm_id: '',
      product_id: '',
      current_stock: '',
      low_stock_threshold: '',
      average_monthly_consumption: '',
      feed_frequency: '',
      feed_frequency_unit: 'daily'
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const isLowStock = (item: InventoryItem) => {
    return item.current_stock <= (item.low_stock_threshold || 0);
  };

  if (isLoading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Track your feed stock levels and consumption</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product to Inventory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Update Inventory' : 'Add to Inventory'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update inventory details' : 'Add a product to your inventory tracking'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farm_id">Farm *</Label>
                <Select value={formData.farm_id} onValueChange={(value) => setFormData({...formData, farm_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.feed_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  step="0.1"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Alert Level</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  step="0.1"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="average_monthly_consumption">Monthly Consumption</Label>
                <Input
                  id="average_monthly_consumption"
                  type="number"
                  step="0.1"
                  value={formData.average_monthly_consumption}
                  onChange={(e) => setFormData({...formData, average_monthly_consumption: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="feed_frequency">Feed Frequency</Label>
                  <Input
                    id="feed_frequency"
                    type="number"
                    value={formData.feed_frequency}
                    onChange={(e) => setFormData({...formData, feed_frequency: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feed_frequency_unit">Unit</Label>
                  <Select value={formData.feed_frequency_unit} onValueChange={(value) => setFormData({...formData, feed_frequency_unit: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update Inventory' : 'Add to Inventory'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {inventory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No inventory tracked</h3>
            <p className="text-gray-600 mb-4">Start tracking your feed inventory</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => (
            <Card key={item.id} className={`hover:shadow-md transition-shadow ${isLowStock(item) ? 'border-red-200 bg-red-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.products.name}</CardTitle>
                    <p className="text-sm text-gray-600">{item.farms.name}</p>
                    <Badge variant="outline" className="mt-1">
                      {item.products.feed_type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Stock:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isLowStock(item) ? 'text-red-600' : 'text-green-600'}`}>
                      {item.current_stock} {item.products.unit}
                    </span>
                    {isLowStock(item) && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>

                {item.low_stock_threshold && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Alert Level:</span>
                    <span>{item.low_stock_threshold} {item.products.unit}</span>
                  </div>
                )}

                {item.average_monthly_consumption && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Monthly Usage:</span>
                    <span>{item.average_monthly_consumption} {item.products.unit}</span>
                  </div>
                )}

                {item.feed_frequency && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Feed Schedule:</span>
                    <span>{item.feed_frequency}x {item.feed_frequency_unit}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Label htmlFor={`stock-${item.id}`} className="text-sm">Quick Update Stock:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id={`stock-${item.id}`}
                      type="number"
                      step="0.1"
                      placeholder="New stock level"
                      className="text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const newStock = parseFloat((e.target as HTMLInputElement).value);
                          if (!isNaN(newStock)) {
                            updateStock(item.id, newStock);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {item.last_order_date && (
                  <p className="text-xs text-gray-400">
                    Last order: {new Date(item.last_order_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Low Stock Alerts Summary */}
      {inventory.filter(isLowStock).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts ({inventory.filter(isLowStock).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventory.filter(isLowStock).map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{item.products.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({item.farms.name})</span>
                  </div>
                  <Badge variant="destructive">
                    {item.current_stock} {item.products.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryManagement;
