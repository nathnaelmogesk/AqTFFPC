import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Users, UserCheck, Plus, Trash2, Edit } from 'lucide-react';

interface FarmerProfile {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  assigned_agent_id?: string;
  created_at: string;
  agentName?: string;
  farmsCount?: number;
  ordersCount?: number;
}

interface AgentProfile {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  assignedFarmersCount?: number;
}

const FarmerAgentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch farmers with their agent information
  const { data: farmers = [], isLoading: farmersLoading } = useQuery({
    queryKey: ['farmers-agents', searchTerm, selectedAgent],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'farmer')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedAgent !== 'all') {
        if (selectedAgent === 'unassigned') {
          query = query.is('assigned_agent_id', null);
        } else {
          query = query.eq('assigned_agent_id', selectedAgent);
        }
      }

      const { data: farmersData, error } = await query;
      if (error) throw error;

      // Enhance farmers with additional data
      const enhancedFarmers = await Promise.all(
        farmersData.map(async (farmer) => {
          const enhancedFarmer: FarmerProfile = { ...farmer };

          // Get agent name if assigned
          if (farmer.assigned_agent_id) {
            const { data: agent } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', farmer.assigned_agent_id)
              .single();
            enhancedFarmer.agentName = agent?.name;
          }

          // Get farms count
          const { count: farmsCount } = await supabase
            .from('farms')
            .select('*', { count: 'exact', head: true })
            .eq('farmer_id', farmer.id);
          enhancedFarmer.farmsCount = farmsCount || 0;

          // Get orders count
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('farmer_id', farmer.id);
          enhancedFarmer.ordersCount = ordersCount || 0;

          return enhancedFarmer;
        })
      );

      return enhancedFarmers;
    },
  });

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents-with-stats'],
    queryFn: async () => {
      const { data: agentsData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('name');

      if (error) throw error;

      // Enhance agents with farmer count
      const enhancedAgents = await Promise.all(
        agentsData.map(async (agent) => {
          const { count: assignedFarmersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_agent_id', agent.id)
            .eq('role', 'farmer');

          return {
            ...agent,
            assignedFarmersCount: assignedFarmersCount || 0,
          };
        })
      );

      return enhancedAgents as AgentProfile[];
    },
  });

  // Assign agent mutation
  const assignAgentMutation = useMutation({
    mutationFn: async ({ farmerIds, agentId }: { farmerIds: string[]; agentId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_agent_id: agentId })
        .in('id', farmerIds);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farmers-agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents-with-stats'] });
      setSelectedFarmers([]);
      setBulkAssignDialogOpen(false);
      toast({
        title: 'Success',
        description: `Agent ${variables.agentId ? 'assigned' : 'removed'} successfully`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update agent assignment',
        variant: 'destructive',
      });
    },
  });

  const handleIndividualAssign = (farmerId: string, agentId: string | null) => {
    assignAgentMutation.mutate({ farmerIds: [farmerId], agentId });
  };

  const handleBulkAssign = (agentId: string | null) => {
    if (selectedFarmers.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select farmers to assign',
        variant: 'destructive',
      });
      return;
    }
    assignAgentMutation.mutate({ farmerIds: selectedFarmers, agentId });
  };

  const toggleFarmerSelection = (farmerId: string) => {
    setSelectedFarmers(prev => 
      prev.includes(farmerId)
        ? prev.filter(id => id !== farmerId)
        : [...prev, farmerId]
    );
  };

  const selectAllFarmers = () => {
    if (selectedFarmers.length === farmers.length) {
      setSelectedFarmers([]);
    } else {
      setSelectedFarmers(farmers.map(f => f.id));
    }
  };

  // Calculate statistics
  const stats = {
    totalFarmers: farmers.length,
    assignedFarmers: farmers.filter(f => f.assigned_agent_id).length,
    unassignedFarmers: farmers.filter(f => !f.assigned_agent_id).length,
    totalAgents: agents.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Farmer-Agent Management</h2>
          <p className="text-gray-600">Assign and manage farmer-agent relationships</p>
        </div>
        <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Bulk Assign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Agent Assignment</DialogTitle>
              <DialogDescription>
                Assign selected farmers ({selectedFarmers.length}) to an agent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={(value) => handleBulkAssign(value === 'unassign' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Remove Agent Assignment</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.assignedFarmersCount} farmers)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Farmers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalFarmers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-green-600">{stats.assignedFarmers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unassignedFarmers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farmer Assignments</CardTitle>
          <CardDescription>
            Manage which agents are responsible for which farmers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search farmers by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farmers</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.assignedFarmersCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {farmersLoading ? (
            <div className="text-center py-8">Loading farmers...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedFarmers.length === farmers.length && farmers.length > 0}
                      onChange={selectAllFarmers}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Farmer Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Farm Info</TableHead>
                  <TableHead>Current Agent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedFarmers.includes(farmer.id)}
                        onChange={() => toggleFarmerSelection(farmer.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{farmer.name}</div>
                        <div className="text-xs text-gray-400">
                          Joined: {new Date(farmer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{farmer.phone || 'No phone'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-32">
                          {farmer.address || 'No address'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{farmer.farmsCount || 0} farms</div>
                        <div className="text-xs text-gray-500">
                          {farmer.ordersCount || 0} orders
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {farmer.assigned_agent_id ? (
                        <Badge className="bg-green-100 text-green-800">
                          {farmer.agentName}
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={farmer.assigned_agent_id || 'unassigned'}
                          onValueChange={(value) => 
                            handleIndividualAssign(farmer.id, value === 'unassigned' ? null : value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">No Agent</SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {farmer.assigned_agent_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIndividualAssign(farmer.id, null)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Agent Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Overview</CardTitle>
          <CardDescription>
            Current agent workload and capacity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{agent.name}</h4>
                      <p className="text-sm text-gray-600">{agent.phone}</p>
                      <p className="text-xs text-gray-500">{agent.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {agent.assignedFarmersCount}
                      </p>
                      <p className="text-xs text-gray-500">farmers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerAgentManagement;