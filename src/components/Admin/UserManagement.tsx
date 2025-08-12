
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
import { Search, Shield, Ban, Users, UserCheck, AlertTriangle } from 'lucide-react';
import CreateUserDialog from './CreateUserDialog';

interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  role?: string;
  language: string;
  created_at: string;
  updated_at: string;
  is_suspended?: boolean;
  assigned_agent_id?: string;
  // Enhanced data
  farms?: Array<{ id: string; name: string; location: string; livestock_type: string }>;
  ordersCount?: number;
  agentName?: string;
  productsCount?: number;
  activeOrdersCount?: number;
  totalSales?: number;
  assignedFarmersCount?: number;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [assignAgentDialogOpen, setAssignAgentDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Enhance each profile with additional data
      const enhancedUsers = await Promise.all(
        profiles.map(async (profile) => {
          const enhancedProfile: UserProfile = { ...profile };

          // Get farms data for farmers
          if (profile.role === 'farmer') {
            const { data: farms } = await supabase
              .from('farms')
              .select('id, name, location, livestock_type')
              .eq('farmer_id', profile.id);
            enhancedProfile.farms = farms || [];

            // Get recent orders count
            const { count: ordersCount } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('farmer_id', profile.id);
            enhancedProfile.ordersCount = ordersCount || 0;

            // Get assigned agent name
            if (profile.assigned_agent_id) {
              const { data: agent } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', profile.assigned_agent_id)
                .maybeSingle();
              enhancedProfile.agentName = agent?.name;
            }
          }

          // Get products and sales data for suppliers
          if (profile.role === 'supplier') {
            const { count: productsCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('supplier_id', profile.id);
            enhancedProfile.productsCount = productsCount || 0;

            // Get active orders count
            const { count: activeOrdersCount } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('supplier_id', profile.id)
              .in('status', ['pending', 'confirmed', 'preparing']);
            enhancedProfile.activeOrdersCount = activeOrdersCount || 0;

            // Get total sales from analytics
            const { data: salesData } = await supabase
              .from('sales_analytics')
              .select('total_sales')
              .eq('supplier_id', profile.id);
            const totalSales = salesData?.reduce((sum, record) => sum + Number(record.total_sales), 0) || 0;
            enhancedProfile.totalSales = totalSales;
          }

          // Get assigned farmers for agents
          if (profile.role === 'agent') {
            const { count: assignedFarmersCount } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_agent_id', profile.id)
              .eq('role', 'farmer');
            enhancedProfile.assignedFarmersCount = assignedFarmersCount || 0;
          }

          return enhancedProfile;
        })
      );

      return enhancedUsers as UserProfile[];
    },
  });

  // Fetch agents for assignment dropdown
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'agent');
      
      if (error) throw error;
      return data;
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Success',
        description: `User ${variables.suspend ? 'suspended' : 'activated'} successfully`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    },
  });

  const assignAgentMutation = useMutation({
    mutationFn: async ({ farmerId, agentId }: { farmerId: string; agentId: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_agent_id: agentId })
        .eq('id', farmerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setAssignAgentDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Agent assigned successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to assign agent',
        variant: 'destructive',
      });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supplier': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'farmer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, newRole });
  };

  const handleSuspendUser = (userId: string, suspend: boolean) => {
    suspendUserMutation.mutate({ userId, suspend });
  };

  const handleAssignAgent = (farmerId: string, agentId: string) => {
    assignAgentMutation.mutate({ farmerId, agentId });
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    farmers: users.filter(u => u.role === 'farmer').length,
    agents: users.filter(u => u.role === 'agent').length,
    suppliers: users.filter(u => u.role === 'supplier').length,
    suspended: users.filter(u => u.is_suspended).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage all users and their roles in the system</p>
        </div>
        <CreateUserDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })} />
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Farmers</p>
                <p className="text-2xl font-bold text-green-600">{userStats.farmers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Agents</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.agents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.suppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{userStats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            View and manage all registered users, their roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="farmer">Farmers</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Details</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Business Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.is_suspended ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                        <div className="text-xs text-gray-400">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role || 'farmer')}>
                        {(user.role || 'farmer').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{user.phone || 'No phone'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-32">
                          {user.address || 'No address'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.role === 'farmer' && (
                          <>
                            <div>{user.farms?.length || 0} farms</div>
                            <div className="text-xs text-gray-500">
                              {user.agentName ? `Agent: ${user.agentName}` : 'No agent assigned'}
                            </div>
                          </>
                        )}
                        {user.role === 'supplier' && (
                          <>
                            <div>{user.productsCount || 0} products</div>
                            <div className="text-xs text-gray-500">
                              {user.activeOrdersCount || 0} active orders
                            </div>
                          </>
                        )}
                        {user.role === 'agent' && (
                          <div>{user.assignedFarmersCount || 0} farmers assigned</div>
                        )}
                        {user.role === 'admin' && (
                          <div className="text-xs text-gray-500">System administrator</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_suspended ? (
                        <Badge className="bg-red-100 text-red-800">Suspended</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.role === 'farmer' && (
                          <div>{user.ordersCount || 0} orders placed</div>
                        )}
                        {user.role === 'supplier' && (
                          <div>
                            <div>Sales: ${(user.totalSales || 0).toLocaleString()}</div>
                            <div className="text-xs text-gray-500">
                              {user.activeOrdersCount || 0} pending
                            </div>
                          </div>
                        )}
                        {user.role === 'agent' && (
                          <div className="text-xs text-gray-500">
                            Managing {user.assignedFarmersCount || 0} farmers
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={user.role || 'farmer'}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {user.role === 'farmer' && (
                          <Dialog open={assignAgentDialogOpen} onOpenChange={setAssignAgentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Agent</DialogTitle>
                                <DialogDescription>
                                  Assign an agent to manage farmer: {selectedUser?.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={(agentId) => handleAssignAgent(user.id, agentId)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {agents.map((agent) => (
                                      <SelectItem key={agent.id} value={agent.id}>
                                        {agent.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={user.is_suspended ? "text-green-600" : "text-red-600"}
                          onClick={() => handleSuspendUser(user.id, !user.is_suspended)}
                        >
                          {user.is_suspended ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                      </div>
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

export default UserManagement;
