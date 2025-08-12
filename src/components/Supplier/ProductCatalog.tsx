import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Edit, Trash2, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  category: string;
  feed_type: string;
  unit_price: number;
  unit: string;
  description: string | null;
  nutritional_content: string | null;
  stock_quantity: number | null;
  discount_available: number | null;
  availability_status: string | null;
  barcode: string | null;
  minimum_order_quantity: number | null;
  image_url: string | null;
}

const ProductCatalog: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    feed_type: '',
    unit_price: '',
    unit: '',
    description: '',
    nutritional_content: '',
    stock_quantity: '',
    discount_available: '',
    availability_status: 'available',
    barcode: '',
    minimum_order_quantity: '1',
    image_url: ''
  });

  const categories = ['Poultry Feed', 'Cattle Feed', 'Pig Feed', 'Fish Feed', 'Goat Feed', 'Sheep Feed'];
  const feedTypes = ['poultry', 'livestock', 'aquaculture', 'swine'];
  const units = ['kg', 'bags', 'tons'];

  useEffect(() => {
    if (user) {
      ensureSupplierExists();
    }
  }, [user]);

  const ensureSupplierExists = async () => {
    if (!user) return;

    try {
      // Check if supplier exists
      const { data: existingSupplier, error: supplierCheckError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', user.id)
        .single();

      if (supplierCheckError && supplierCheckError.code === 'PGRST116') {
        // Supplier doesn't exist, create one
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, phone, address')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to fetch profile information.",
            variant: "destructive",
          });
          return;
        }

        const { error: supplierCreateError } = await supabase
          .from('suppliers')
          .insert({
            id: user.id,
            name: profile.name || 'Unknown Supplier',
            contact_name: profile.name || 'Unknown Contact',
            phone: profile.phone || '000-000-0000',
            email: user.email || 'no-email@example.com',
            address: profile.address || 'No address provided',
            business_registration_number: 'REG-' + user.id.substring(0, 8)
          });

        if (supplierCreateError) {
          console.error('Error creating supplier:', supplierCreateError);
          toast({
            title: "Error",
            description: "Failed to create supplier profile.",
            variant: "destructive",
          });
          return;
        }
      }

      // Now fetch products
      fetchProducts();
    } catch (error) {
      console.error('Error ensuring supplier exists:', error);
      toast({
        title: "Error",
        description: "Failed to initialize supplier profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.unit) {
      toast({
        title: "Validation Error",
        description: "Please select a unit for the product.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error", 
        description: "Please select a category for the product.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.feed_type) {
      toast({
        title: "Validation Error",
        description: "Please select a feed type for the product.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        feed_type: formData.feed_type,
        unit_price: parseFloat(formData.unit_price),
        unit: formData.unit,
        description: formData.description || null,
        nutritional_content: formData.nutritional_content || null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        discount_available: formData.discount_available ? parseFloat(formData.discount_available) : null,
        availability_status: formData.availability_status,
        barcode: formData.barcode || null,
        minimum_order_quantity: parseFloat(formData.minimum_order_quantity),
        image_url: formData.image_url || null,
        supplier_id: user.id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Product Added",
          description: "New product has been added to your catalog.",
        });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      feed_type: product.feed_type,
      unit_price: product.unit_price.toString(),
      unit: product.unit,
      description: product.description || '',
      nutritional_content: product.nutritional_content || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      discount_available: product.discount_available?.toString() || '',
      availability_status: product.availability_status || 'available',
      barcode: product.barcode || '',
      minimum_order_quantity: product.minimum_order_quantity?.toString() || '1',
      image_url: product.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Deleted",
        description: "Product has been removed from your catalog.",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      feed_type: '',
      unit_price: '',
      unit: '',
      description: '',
      nutritional_content: '',
      stock_quantity: '',
      discount_available: '',
      availability_status: 'available',
      barcode: '',
      minimum_order_quantity: '1',
      image_url: ''
    });
  };

  const getAvailabilityBadge = (status: string | null) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
      case 'limited':
        return <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600">Manage your feed products and inventory</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feed_type">Feed Type</Label>
                  <Select 
                    value={formData.feed_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, feed_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feed type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poultry">Poultry</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                      <SelectItem value="aquaculture">Aquaculture</SelectItem>
                      <SelectItem value="swine">Swine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="Enter stock quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_order_quantity">Minimum Order Quantity</Label>
                  <Input
                    id="minimum_order_quantity"
                    type="number"
                    step="0.01"
                    value={formData.minimum_order_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_order_quantity: e.target.value }))}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_available">Discount (%)</Label>
                  <Input
                    id="discount_available"
                    type="number"
                    step="0.01"
                    value={formData.discount_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_available: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability_status">Availability Status</Label>
                  <Select 
                    value={formData.availability_status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, availability_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Enter barcode"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nutritional_content">Nutritional Content</Label>
                <Textarea
                  id="nutritional_content"
                  value={formData.nutritional_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, nutritional_content: e.target.value }))}
                  placeholder="Enter nutritional information"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Product Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="Enter image URL"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Start building your product catalog by adding your first feed product.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-gray-600">{product.category} - {product.feed_type}</p>
                  </div>
                  {product.image_url && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ml-3">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-green-600">
                    ${product.unit_price}/{product.unit}
                  </span>
                  {getAvailabilityBadge(product.availability_status)}
                </div>

                {product.stock_quantity && (
                  <div className="text-sm text-gray-600">
                    Stock: {product.stock_quantity} {product.unit}
                  </div>
                )}

                {product.discount_available && product.discount_available > 0 && (
                  <div className="text-sm text-orange-600">
                    {product.discount_available}% discount available
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  Min. order: {product.minimum_order_quantity} {product.unit}
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
