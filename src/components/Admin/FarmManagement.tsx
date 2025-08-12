import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, Search, Eye, MapPin, Users } from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  location: string;
  size: number;
  size_unit: string;
  livestock_type: string;
  farmer_id: string;
  created_at: string;
  profiles?: { name: string };
}

const FarmManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['admin-farms', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('farms')
        .select(`
          *,
          profiles!farms_farmer_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Farm[];
    },
  });

  const getLivestockTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'poultry': return 'bg-yellow-100 text-yellow-800';
      case 'cattle': return 'bg-brown-100 text-brown-800';
      case 'swine': return 'bg-pink-100 text-pink-800';
      case 'fish': return 'bg-blue-100 text-blue-800';
      case 'goat': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalFarms = farms.length;
  const livestockStats = farms.reduce((acc: any, farm) => {
    acc[farm.livestock_type] = (acc[farm.livestock_type] || 0) + 1;
    return acc;
  }, {});

  const totalSize = farms.reduce((sum, farm) => sum + Number(farm.size), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Farm Management</h2>
          <p className="text-gray-600">Monitor and manage all registered farms</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">hectares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(farms.map(f => f.farmer_id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Farm Size</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalFarms > 0 ? (totalSize / totalFarms).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">hectares</p>
          </CardContent>
        </Card>
      </div>

      {/* Livestock Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Livestock Distribution</CardTitle>
          <CardDescription>
            Distribution of farms by livestock type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(livestockStats).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold">{count as number}</div>
                <Badge className={getLivestockTypeColor(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Farms</CardTitle>
          <CardDescription>
            Comprehensive view of all registered farms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search farms by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading farms...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farm Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Livestock Type</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farms.map((farm) => (
                  <TableRow key={farm.id}>
                    <TableCell>
                      <div className="font-medium">{farm.name}</div>
                    </TableCell>
                    <TableCell>{farm.profiles?.name}</TableCell>
                    <TableCell>{farm.location}</TableCell>
                    <TableCell>
                      {Number(farm.size).toLocaleString()} {farm.size_unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={getLivestockTypeColor(farm.livestock_type)}>
                        {farm.livestock_type.charAt(0).toUpperCase() + farm.livestock_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(farm.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFarm(farm)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Farm Details</DialogTitle>
                            <DialogDescription>
                              Complete farm information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedFarm && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Farm Information</h4>
                                  <p><strong>Name:</strong> {selectedFarm.name}</p>
                                  <p><strong>Owner:</strong> {selectedFarm.profiles?.name}</p>
                                  <p><strong>Location:</strong> {selectedFarm.location}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Farm Details</h4>
                                  <p><strong>Size:</strong> {Number(selectedFarm.size).toLocaleString()} {selectedFarm.size_unit}</p>
                                  <p><strong>Livestock:</strong> {selectedFarm.livestock_type}</p>
                                  <p><strong>Registered:</strong> {new Date(selectedFarm.created_at).toLocaleDateString()}</p>
                                </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmManagement;
