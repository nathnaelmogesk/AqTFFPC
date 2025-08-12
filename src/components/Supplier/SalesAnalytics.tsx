
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, Clock } from 'lucide-react';

interface SalesData {
  total_sales: number;
  total_quantity: number;
  total_orders: number;
  fulfillment_rate: number;
  period_start: string;
  products: {
    name: string;
  };
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageFulfillmentRate: number;
  topProducts: Array<{ name: string; sales: number; quantity: number }>;
}

const SalesAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageFulfillmentRate: 0,
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchSalesData();
  }, [user, period]);

  const fetchSalesData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch sales analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('sales_analytics')
        .select(`
          *,
          products(name)
        `)
        .eq('supplier_id', user.id)
        .order('period_start', { ascending: false })
        .limit(12);

      if (analyticsError) throw analyticsError;

      setSalesData(analyticsData || []);

      // Calculate dashboard stats
      const totalRevenue = analyticsData?.reduce((sum, item) => sum + parseFloat(item.total_sales.toString()), 0) || 0;
      const totalOrders = analyticsData?.reduce((sum, item) => sum + (item.total_orders || 0), 0) || 0;
      const averageFulfillmentRate = analyticsData?.length 
        ? analyticsData.reduce((sum, item) => sum + parseFloat(item.fulfillment_rate.toString()), 0) / analyticsData.length 
        : 0;

      // Get top products
      const productSales = analyticsData?.reduce((acc, item) => {
        const productName = item.products?.name || 'Unknown Product';
        if (!acc[productName]) {
          acc[productName] = { name: productName, sales: 0, quantity: 0 };
        }
        acc[productName].sales += parseFloat(item.total_sales.toString());
        acc[productName].quantity += parseFloat(item.total_quantity.toString());
        return acc;
      }, {} as Record<string, { name: string; sales: number; quantity: number }>) || {};

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setDashboardStats({
        totalRevenue,
        totalOrders,
        averageFulfillmentRate,
        topProducts
      });

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = salesData.map(item => ({
    period: new Date(item.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    sales: parseFloat(item.total_sales.toString()),
    orders: item.total_orders,
    fulfillment: parseFloat(item.fulfillment_rate.toString()) * 100
  })).reverse();

  const pieChartData = dashboardStats.topProducts.map((product, index) => ({
    name: product.name,
    value: product.sales,
    color: `hsl(${index * 72}, 70%, 50%)`
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600">Track your sales performance and trends</p>
          </div>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {dashboardStats.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dashboardStats.averageFulfillmentRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardStats.totalOrders > 0 ? (dashboardStats.totalRevenue / dashboardStats.totalOrders).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        {pieChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Products Table */}
      {dashboardStats.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.topProducts.map((product, index) => (
                <div key={`${product.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${product.sales.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {salesData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data available</h3>
            <p className="text-gray-500 text-center">
              Sales analytics will appear here once you start delivering orders.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesAnalytics;
