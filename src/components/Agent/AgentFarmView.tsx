import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Search, MapPin, Users, Package, Calendar, TrendingUp, Edit, Fish, Egg } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FarmData {
  id: string;
  name: string;
  location: string;
  size: number;
  size_unit: string;
  livestock_type: string;
  details?: string;
  farm_stage?: string;
  number_of_fish?: number;
  number_of_chicken?: number;
  farm_start_date?: string;
  created_at: string;
  profiles?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
  };
}

const AgentFarmView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLivestock, setSelectedLivestock] = useState<string>('all');
  const [selectedFarm, setSelectedFarm] = useState<FarmData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    farm_stage: '',
    number_of_fish: 0,
    number_of_chicken: 0,
    farm_start_date: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all farms with farmer details
  const { data: farms, isLoading } = useQuery({
    queryKey: ['agent-farms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          id,
          name,
          location,
          size,
          size_unit,
          livestock_type,
          details,
          farm_stage,
          number_of_fish,
          number_of_chicken,
          farm_start_date,
          created_at,
          profiles!farms_farmer_id_fkey(
            id,
            name,
            phone,
            address
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Update farm mutation
  const updateFarmMutation = useMutation({
    mutationFn: async (updatedData: { id: string; farm_stage?: string; number_of_fish?: number; number_of_chicken?: number; farm_start_date?: string }) => {
      const { data, error } = await supabase
        .from('farms')
        .update({
          farm_stage: updatedData.farm_stage,
          number_of_fish: updatedData.number_of_fish,
          number_of_chicken: updatedData.number_of_chicken,
          farm_start_date: updatedData.farm_start_date
        })
        .eq('id', updatedData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-farms'] });
      toast({
        title: "Success",
        description: "Farm details updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update farm details",
        variant: "destructive",
      });
      console.error('Error updating farm:', error);
    }
  });

  const handleEditFarm = (farm: FarmData) => {
    setSelectedFarm(farm);
    setFormData({
      farm_stage: farm.farm_stage || '',
      number_of_fish: farm.number_of_fish || 0,
      number_of_chicken: farm.number_of_chicken || 0,
      farm_start_date: farm.farm_start_date ? farm.farm_start_date.split('T')[0] : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedFarm) return;
    
    updateFarmMutation.mutate({
      id: selectedFarm.id,
      ...formData
    });
  };

  // Fetch farm statistics
  const { data: farmStats } = useQuery({
    queryKey: ['agent-farm-stats'],
    queryFn: async () => {
      if (!farms) return null;

      const farmIds = farms.map(farm => farm.id);
      
      // Get inventory data for all farms
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('farm_id, current_stock, low_stock_threshold')
        .in('farm_id', farmIds);
      
      if (inventoryError) throw inventoryError;

      // Get recent orders for all farms
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('farm_id, created_at, total_price, status')
        .in('farm_id', farmIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (ordersError) throw ordersError;

      // Calculate stats per farm
      const farmStatsMap = farmIds.reduce((acc, farmId) => {
        const farmInventory = inventoryData?.filter(inv => inv.farm_id === farmId) || [];
        const farmOrders = ordersData?.filter(order => order.farm_id === farmId) || [];
        
        const lowStockItems = farmInventory.filter(inv => 
          inv.current_stock < (inv.low_stock_threshold || 0)
        ).length;
        
        const totalSpent = farmOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
        
        acc[farmId] = {
          inventoryItems: farmInventory.length,
          lowStockItems,
          recentOrders: farmOrders.length,
          totalSpent
        };
        
        return acc;
      }, {} as Record<string, any>);

      return farmStatsMap;
    },
    enabled: !!farms
  });

  // Get unique livestock types for filtering
  const livestockTypes = [...new Set(farms?.map(farm => farm.livestock_type) || [])];

  const filteredFarms = farms?.filter(farm => {
    const matchesSearch = 
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLivestock = selectedLivestock === 'all' || farm.livestock_type === selectedLivestock;
    
    return matchesSearch && matchesLivestock;
  }) || [];

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Farm Overview</h2>
        <p className="text-gray-600">Monitor all farms in your region</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search farms, locations, or farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLivestock} onValueChange={setSelectedLivestock}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Livestock type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Livestock</SelectItem>
                {livestockTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Farms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredFarms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map((farm) => {
            const stats = farmStats?.[farm.id] || {};
            
            return (
              <Card key={farm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {farm.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Users className="w-4 h-4" />
                        {farm.profiles?.name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {farm.livestock_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {farm.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      {farm.size} {farm.size_unit}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {farm.farm_start_date ? `Started ${formatDate(farm.farm_start_date)}` : `Registered ${formatDate(farm.created_at)}`}
                    </div>
                    {(farm.number_of_fish || farm.number_of_chicken) && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {farm.number_of_fish > 0 && (
                          <div className="flex items-center gap-1">
                            <Fish className="w-4 h-4" />
                            {farm.number_of_fish} fish
                          </div>
                        )}
                        {farm.number_of_chicken > 0 && (
                          <div className="flex items-center gap-1">
                            <Egg className="w-4 h-4" />
                            {farm.number_of_chicken} chicken
                          </div>
                        )}
                      </div>
                    )}
                    {farm.farm_stage && (
                      <div className="text-sm">
                        <Badge variant="secondary">{farm.farm_stage}</Badge>
                      </div>
                    )}
                  </div>

                  {farm.details && (
                    <p className="text-sm text-gray-600 line-clamp-2">{farm.details}</p>
                  )}

                  {/* Farm Statistics */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-blue-600 font-medium">{stats.inventoryItems || 0}</p>
                        <p className="text-blue-500">Inventory Items</p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <p className="text-orange-600 font-medium">{stats.lowStockItems || 0}</p>
                        <p className="text-orange-500">Low Stock</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-green-600 font-medium">{stats.recentOrders || 0}</p>
                        <p className="text-green-500">Recent Orders</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="text-purple-600 font-medium">{formatCurrency(stats.totalSpent || 0)}</p>
                        <p className="text-purple-500">30-day Spend</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditFarm(farm)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No farms found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedLivestock !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'No farms have been registered yet'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Farm Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Farm Details</DialogTitle>
            <DialogDescription>
              Update the regular farm information for {selectedFarm?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farm_stage" className="text-right">
                Farm Stage
              </Label>
              <Select 
                value={formData.farm_stage} 
                onValueChange={(value) => setFormData({...formData, farm_stage: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select farm stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="preparation">Preparation</SelectItem>
                  <SelectItem value="seeding">Seeding/Stocking</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number_of_fish" className="text-right">
                Number of Fish
              </Label>
              <Input
                id="number_of_fish"
                type="number"
                min="0"
                value={formData.number_of_fish}
                onChange={(e) => setFormData({...formData, number_of_fish: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number_of_chicken" className="text-right">
                Number of Chicken
              </Label>
              <Input
                id="number_of_chicken"
                type="number"
                min="0"
                value={formData.number_of_chicken}
                onChange={(e) => setFormData({...formData, number_of_chicken: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farm_start_date" className="text-right">
                Farm Start Date
              </Label>
              <Input
                id="farm_start_date"
                type="date"
                value={formData.farm_start_date}
                onChange={(e) => setFormData({...formData, farm_start_date: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={updateFarmMutation.isPending}
            >
              {updateFarmMutation.isPending ? "Updating..." : "Update Farm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentFarmView;