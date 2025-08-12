import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Building2, 
  Package, 
  Calendar,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FarmerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<string | null>(null);

  // Fetch farmers assigned to current agent
  const { data: farmers, isLoading: farmersLoading } = useQuery({
    queryKey: ['agent-farmers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          address,
          created_at,
          bank_account_number,
          cooperative_association
        `)
        .eq('role', 'farmer')
        .eq('assigned_agent_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch farmer details with farms
  const { data: farmerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['farmer-details', selectedFarmer],
    queryFn: async () => {
      if (!selectedFarmer) return null;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedFarmer)
        .single();
      
      if (profileError) throw profileError;

      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', selectedFarmer);
      
      if (farmsError) throw farmsError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, total_price, status')
        .eq('farmer_id', selectedFarmer)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ordersError) throw ordersError;

      return { profile, farms, orders };
    },
    enabled: !!selectedFarmer
  });

  const filteredFarmers = farmers?.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Farmers List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Farmers ({filteredFarmers.length})
            </CardTitle>
            <CardDescription>Manage farmers in your region</CardDescription>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
              {farmersLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredFarmers.length > 0 ? (
                <div className="space-y-1">
                  {filteredFarmers.map((farmer) => (
                    <div
                      key={farmer.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedFarmer === farmer.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedFarmer(farmer.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{farmer.name}</h3>
                          <div className="space-y-1 mt-1">
                            {farmer.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                {farmer.phone}
                              </div>
                            )}
                            {farmer.address && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-3 h-3" />
                                {farmer.address}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Joined {formatDate(farmer.created_at)}
                          </p>
                        </div>
                        {selectedFarmer === farmer.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No farmers found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmer Details */}
      <div className="lg:col-span-2">
        {selectedFarmer ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Farmer Details</CardTitle>
                  <CardDescription>Complete farmer information and activity</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {detailsLoading ? (
                <div className="space-y-4">
                  <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : farmerDetails ? (
                <Tabs defaultValue="profile" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="farms">Farms ({farmerDetails.farms?.length || 0})</TabsTrigger>
                    <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-lg font-medium">{farmerDetails.profile.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="text-lg">{farmerDetails.profile.phone || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-lg">{farmerDetails.profile.address || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bank Account</label>
                        <p className="text-lg">{farmerDetails.profile.bank_account_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cooperative</label>
                        <p className="text-lg">{farmerDetails.profile.cooperative_association || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Member Since</label>
                        <p className="text-lg">{formatDate(farmerDetails.profile.created_at)}</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="farms" className="space-y-4">
                    {farmerDetails.farms && farmerDetails.farms.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {farmerDetails.farms.map((farm: any) => (
                          <Card key={farm.id}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                {farm.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{farm.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{farm.livestock_type}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Size: {farm.size} {farm.size_unit}
                              </div>
                              {farm.details && (
                                <p className="text-sm text-gray-600 mt-2">{farm.details}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No farms registered</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="orders" className="space-y-4">
                    {farmerDetails.orders && farmerDetails.orders.length > 0 ? (
                      <div className="space-y-3">
                        {farmerDetails.orders.map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(Number(order.total_price))}</p>
                              <Badge className={getStatusBadgeClass(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No recent orders</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Failed to load farmer details</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Select a farmer</p>
                <p className="text-sm">Choose a farmer from the list to view their details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FarmerManagement;