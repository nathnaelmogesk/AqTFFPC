import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DemandForecast {
  id: string;
  product_id: string;
  predicted_demand: number;
  confidence_level: number;
  forecast_date: string;
  forecast_period: string;
  notes: string;
  products: {
    name: string;
    unit: string;
    feed_type: string;
  };
}

interface Product {
  id: string;
  name: string;
  unit: string;
  feed_type: string;
}

const DemandForecastingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedProduct, selectedPeriod]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch demand forecasts
      let query = supabase
        .from('demand_forecasts')
        .select(`
          *,
          products(name, unit, feed_type)
        `)
        .eq('supplier_id', user.id)
        .order('forecast_date', { ascending: false });

      if (selectedProduct !== 'all') {
        query = query.eq('product_id', selectedProduct);
      }

      if (selectedPeriod !== 'all') {
        query = query.eq('forecast_period', selectedPeriod);
      }

      const { data: forecastData, error: forecastError } = await query;
      if (forecastError) throw forecastError;

      // Fetch products for this supplier
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, unit, feed_type')
        .eq('supplier_id', user.id);

      if (productError) throw productError;

      setForecasts(forecastData || []);
      setProducts(productData || []);
    } catch (error: any) {
      console.error('Error fetching forecast data:', error);
      toast({
        title: "Error",
        description: "Failed to load demand forecasting data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewForecasts = async () => {
    if (!user) return;

    try {
      // Simple forecast generation based on historical sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_analytics')
        .select('*')
        .eq('supplier_id', user.id);

      if (salesError) throw salesError;

      const forecastsToInsert = [];
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      for (const product of products) {
        const productSales = salesData?.filter(s => s.product_id === product.id) || [];
        const avgDemand = productSales.length > 0 
          ? productSales.reduce((sum, s) => sum + Number(s.total_quantity), 0) / productSales.length
          : 50; // Default if no historical data

        // Generate forecast with some variation
        const predictedDemand = Math.round(avgDemand * (0.8 + Math.random() * 0.4));
        const confidenceLevel = productSales.length > 2 ? 0.8 + Math.random() * 0.2 : 0.5 + Math.random() * 0.3;

        forecastsToInsert.push({
          product_id: product.id,
          supplier_id: user.id,
          predicted_demand: predictedDemand,
          confidence_level: confidenceLevel,
          forecast_date: nextMonth.toISOString().split('T')[0],
          forecast_period: 'monthly',
          notes: `Generated forecast based on ${productSales.length} months of historical data`
        });
      }

      const { error: insertError } = await supabase
        .from('demand_forecasts')
        .insert(forecastsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Forecasts Generated",
        description: `Generated ${forecastsToInsert.length} new demand forecasts`,
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

  const chartData = forecasts.map(forecast => ({
    date: new Date(forecast.forecast_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    demand: forecast.predicted_demand,
    confidence: Math.round(forecast.confidence_level * 100),
    product: forecast.products.name
  }));

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  const totalPredictedDemand = forecasts.reduce((sum, f) => sum + f.predicted_demand, 0);
  const averageConfidence = forecasts.length > 0 
    ? forecasts.reduce((sum, f) => sum + f.confidence_level, 0) / forecasts.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Demand Forecasting</h2>
          <p className="text-muted-foreground">Predict future demand for your products</p>
        </div>
        <Button onClick={generateNewForecasts} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Generate New Forecasts
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Predicted Demand</p>
                <p className="text-2xl font-bold">{totalPredictedDemand.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Confidence</p>
                <p className="text-2xl font-bold">{(averageConfidence * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Forecasts</p>
                <p className="text-2xl font-bold">{forecasts.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="demand" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="confidence" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecast Details */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : forecasts.length > 0 ? (
            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <div key={forecast.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{forecast.products.name}</h3>
                        <Badge variant="outline">{forecast.products.feed_type}</Badge>
                        {getConfidenceBadge(forecast.confidence_level)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><strong>Predicted Demand:</strong></p>
                          <p>{forecast.predicted_demand} {forecast.products.unit}</p>
                        </div>
                        <div>
                          <p><strong>Forecast Period:</strong></p>
                          <p className="capitalize">{forecast.forecast_period}</p>
                        </div>
                        <div>
                          <p><strong>Forecast Date:</strong></p>
                          <p>{new Date(forecast.forecast_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Confidence:</strong></p>
                          <p>{(forecast.confidence_level * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      {forecast.notes && (
                        <div className="mt-3 p-3 bg-muted rounded">
                          <p className="text-sm">{forecast.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No forecasts available</h3>
              <p className="text-muted-foreground mb-4">
                Generate demand forecasts to predict future product demand
              </p>
              <Button onClick={generateNewForecasts}>
                Generate Forecasts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandForecastingDashboard;