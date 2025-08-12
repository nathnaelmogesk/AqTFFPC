
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Package, CreditCard, Truck } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  unit: string;
  feed_type: string;
  minimum_order_quantity: number;
  stock_quantity: number;
  availability_status: string;
  suppliers: {
    id: string;
    name: string;
    contact_name: string;
  };
}

interface Farm {
  id: string;
  name: string;
  location: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const OrderPlacement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isCredit, setIsCredit] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterFeedType, setFilterFeedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch products with suppliers
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          suppliers!inner(id, name, contact_name)
        `)
        .eq('availability_status', 'available');

      if (productsError) throw productsError;

      // Fetch user's farms
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('id, name, location')
        .eq('farmer_id', user.id);

      if (farmsError) throw farmsError;

      setProducts(productsData || []);
      setFarms(farmsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + (product.minimum_order_quantity || 1) }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: product.minimum_order_quantity || 1 }]);
    }

    toast({
      title: "Added to Cart",
      description: `${product.name} added to your order`,
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.unit_price * item.quantity), 0);
  };

  const calculateTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const placeOrder = async () => {
    if (!user || cart.length === 0 || !selectedFarm || !deliveryAddress) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add items to cart",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Group cart items by supplier
      const ordersBySupplier = cart.reduce((acc, item) => {
        const supplierId = item.product.suppliers.id;
        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplier: item.product.suppliers,
            items: []
          };
        }
        acc[supplierId].items.push(item);
        return acc;
      }, {} as Record<string, { supplier: any; items: CartItem[] }>);

      // Create separate orders for each supplier
      for (const [supplierId, orderData] of Object.entries(ordersBySupplier)) {
        const orderTotal = orderData.items.reduce((total, item) => 
          total + (item.product.unit_price * item.quantity), 0
        );
        
        const orderQuantity = orderData.items.reduce((total, item) => 
          total + item.quantity, 0
        );

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            farmer_id: user.id,
            farm_id: selectedFarm,
            supplier_id: supplierId,
            delivery_address: deliveryAddress,
            total_price: orderTotal,
            total_quantity: orderQuantity,
            payment_method: paymentMethod,
            is_credit: isCredit,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.unit_price,
          status: 'pending'
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update inventory last order date if inventory exists
        for (const item of orderData.items) {
          await supabase
            .from('inventory')
            .update({ last_order_date: new Date().toISOString().split('T')[0] })
            .eq('farm_id', selectedFarm)
            .eq('product_id', item.product.id);
        }
      }

      toast({
        title: "Order Placed Successfully",
        description: `${Object.keys(ordersBySupplier).length} order(s) placed for RWF ${calculateTotal().toLocaleString()}`,
      });

      // Clear cart and form
      setCart([]);
      setSelectedFarm('');
      setDeliveryAddress('');
      setPaymentMethod('');
      setIsCredit(false);

    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSupplier = filterSupplier === 'all' || product.suppliers.id === filterSupplier;
    const matchesFeedType = filterFeedType === 'all' || product.feed_type === filterFeedType;
    return matchesSupplier && matchesFeedType;
  });

  const suppliers = [...new Set(products.map(p => p.suppliers))];
  const feedTypes = [...new Set(products.map(p => p.feed_type))];

  if (isLoading) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Place Order</h2>
          <p className="text-gray-600">Browse products and place your feed orders</p>
        </div>
        {cart.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <ShoppingCart className="w-4 h-4 mr-1" />
            {cart.length} items
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Supplier</Label>
                  <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="All suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Feed Type</Label>
                  <Select value={filterFeedType} onValueChange={setFilterFeedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All feed types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All feed types</SelectItem>
                      {feedTypes.map((feedType) => (
                        <SelectItem key={feedType} value={feedType}>
                          {feedType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600">{product.suppliers.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {product.feed_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">RWF {product.unit_price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">per {product.unit}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.description && (
                    <p className="text-sm text-gray-600">{product.description}</p>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Min. Order:</span>
                    <span>{product.minimum_order_quantity} {product.unit}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>In Stock:</span>
                    <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {product.stock_quantity} {product.unit}
                    </span>
                  </div>

                  <Button 
                    onClick={() => addToCart(product)}
                    className="w-full"
                    disabled={product.stock_quantity === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart and Order Section */}
        <div className="space-y-4">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Your cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600">{item.product.suppliers.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-medium text-sm">
                          RWF {(item.product.unit_price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total: RWF {calculateTotal().toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {calculateTotalQuantity()} items total
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Farm *</Label>
                  <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose farm" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.name} - {farm.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delivery Address *</Label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash on Delivery</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCredit"
                    checked={isCredit}
                    onChange={(e) => setIsCredit(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isCredit">Request credit terms</Label>
                </div>

                <Button 
                  onClick={placeOrder}
                  disabled={isPlacingOrder || !selectedFarm || !deliveryAddress}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isPlacingOrder ? (
                    "Placing Order..."
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Place Order - RWF {calculateTotal().toLocaleString()}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPlacement;
