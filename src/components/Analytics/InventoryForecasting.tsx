import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, ShoppingCart, Calendar, TrendingDown, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface ReorderSuggestion {
  inventoryId: string;
  productName: string;
  farmName: string;
  currentStock: number;
  suggestedQuantity: number;
  daysUntilEmpty: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

const InventoryForecasting: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');

  useEffect(() => {
    if (user) {
      fetchInventoryData();
    }
  }, [user]);

  useEffect(() => {
    if (inventory.length > 0) {
      generateReorderSuggestions();
    }
  }, [inventory, selectedTimeframe]);

  const fetchInventoryData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

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

      setInventory(inventoryData || []);
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReorderSuggestions = () => {
    const suggestions: ReorderSuggestion[] = [];
    const forecastDays = parseInt(selectedTimeframe);

    inventory.forEach((item) => {
      // Calculate daily consumption
      let dailyConsumption = 0;
      if (item.average_monthly_consumption && item.average_monthly_consumption > 0) {
        dailyConsumption = item.average_monthly_consumption / 30;
      } else if (item.feed_frequency && item.feed_frequency > 0) {
        // Estimate based on feed frequency (assume 1 unit per feeding)
        const feedingsPerDay = item.feed_frequency_unit === 'daily' ? item.feed_frequency :
                               item.feed_frequency_unit === 'weekly' ? item.feed_frequency / 7 :
                               item.feed_frequency / 30;
        dailyConsumption = feedingsPerDay;
      }

      if (dailyConsumption > 0) {
        const daysUntilEmpty = Math.floor(item.current_stock / dailyConsumption);
        const projectedStock = item.current_stock - (dailyConsumption * forecastDays);
        
        if (daysUntilEmpty <= forecastDays || projectedStock <= (item.low_stock_threshold || 0)) {
          // Calculate suggested reorder quantity (enough for next month + buffer)
          const suggestedQuantity = Math.ceil((dailyConsumption * 30) * 1.2); // 20% buffer
          
          let priority: 'high' | 'medium' | 'low' = 'low';
          let reasoning = '';

          if (daysUntilEmpty <= 7) {
            priority = 'high';
            reasoning = `Critical: Only ${daysUntilEmpty} days of stock remaining`;
          } else if (daysUntilEmpty <= 14) {
            priority = 'medium';
            reasoning = `Warning: ${daysUntilEmpty} days of stock remaining`;
          } else {
            priority = 'low';
            reasoning = `Low stock forecast in ${forecastDays} days`;
          }

          suggestions.push({
            inventoryId: item.id,
            productName: item.products.name,
            farmName: item.farms.name,
            currentStock: item.current_stock,
            suggestedQuantity,
            daysUntilEmpty,
            priority,
            reasoning
          });
        }
      }
    });

    // Sort by priority and days until empty
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.daysUntilEmpty - b.daysUntilEmpty;
    });

    setReorderSuggestions(suggestions);
  };

  const createOrder = async (suggestion: ReorderSuggestion) => {
    try {
      // This is a simplified order creation - in a real app, you'd redirect to order page
      // with pre-filled data or create a draft order
      toast({
        title: "Order Initiated",
        description: `Redirecting to create order for ${suggestion.productName}`,
      });
      
      // You could implement actual order creation logic here
      // or redirect to the order placement page with pre-filled data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <Bell className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Package className="w-5 h-5 text-blue-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const highPriorityCount = reorderSuggestions.filter(s => s.priority === 'high').length;
  const mediumPriorityCount = reorderSuggestions.filter(s => s.priority === 'medium').length;
  const totalSuggestedValue = reorderSuggestions.reduce((sum, s) => sum + s.suggestedQuantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Forecasting</h2>
          <p className="text-muted-foreground">Automated reorder suggestions based on consumption patterns</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Label htmlFor="timeframe">Forecast Period:</Label>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suggestions</p>
                <p className="text-2xl font-bold">{reorderSuggestions.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                <p className="text-2xl font-bold text-yellow-600">{mediumPriorityCount}</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Reorder Volume</p>
                <p className="text-2xl font-bold">{totalSuggestedValue.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Reorder Suggestions ({reorderSuggestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : reorderSuggestions.length > 0 ? (
            <div className="space-y-4">
              {reorderSuggestions.map((suggestion, index) => (
                <div key={`${suggestion.inventoryId}-${index}`} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPriorityIcon(suggestion.priority)}
                        <h3 className="font-medium">{suggestion.productName}</h3>
                        {getPriorityBadge(suggestion.priority)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><strong>Farm:</strong> {suggestion.farmName}</p>
                          <p><strong>Current Stock:</strong> {suggestion.currentStock}</p>
                        </div>
                        <div>
                          <p><strong>Days Until Empty:</strong> {suggestion.daysUntilEmpty}</p>
                          <p><strong>Suggested Quantity:</strong> {suggestion.suggestedQuantity}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p><strong>Reasoning:</strong></p>
                          <p className="italic">{suggestion.reasoning}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <Button 
                        onClick={() => createOrder(suggestion)}
                        className="gap-2"
                        variant={suggestion.priority === 'high' ? 'destructive' : 'default'}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Create Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No reorder suggestions</h3>
              <p className="text-muted-foreground">
                Your inventory levels look good for the selected forecast period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Accuracy Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900">Forecast Accuracy</h4>
              <p className="text-sm text-blue-700 mt-1">
                Suggestions are based on historical consumption patterns and current stock levels. 
                Actual consumption may vary due to seasonal changes, livestock health, or feeding schedule adjustments.
                Regularly update your consumption data for more accurate predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryForecasting;