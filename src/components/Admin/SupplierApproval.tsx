
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Phone, Mail, MapPin, Building } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  business_registration_number: string;
  is_active: boolean;
  created_at: string;
}

const SupplierApproval: React.FC = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['pending-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const updateSupplierStatusMutation = useMutation({
    mutationFn: async ({ supplierId, isActive }: { supplierId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: isActive })
        .eq('id', supplierId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-suppliers'] });
      toast({
        title: 'Success',
        description: `Supplier ${variables.isActive ? 'approved' : 'suspended'} successfully`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update supplier status',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (supplierId: string) => {
    updateSupplierStatusMutation.mutate({ supplierId, isActive: true });
  };

  const handleSuspend = (supplierId: string) => {
    updateSupplierStatusMutation.mutate({ supplierId, isActive: false });
  };

  const pendingSuppliers = suppliers.filter(s => !s.is_active);
  const activeSuppliers = suppliers.filter(s => s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
        <p className="text-gray-600">Review and approve supplier applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>Suppliers awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingSuppliers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Suppliers</CardTitle>
            <CardDescription>Approved and operating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeSuppliers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Suppliers</CardTitle>
            <CardDescription>All registered suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Suppliers */}
      {pendingSuppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Supplier Applications</CardTitle>
            <CardDescription>
              Review these suppliers and approve or reject their applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.address}</div>
                    </TableCell>
                    <TableCell>{supplier.contact_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1" />
                          {supplier.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1" />
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {supplier.business_registration_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(supplier.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSupplier(supplier)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Supplier Details</DialogTitle>
                              <DialogDescription>
                                Review complete supplier information
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSupplier && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Business Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center">
                                        <Building className="w-4 h-4 mr-2" />
                                        {selectedSupplier.name}
                                      </div>
                                      <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {selectedSupplier.address}
                                      </div>
                                      <div>
                                        <strong>Registration:</strong> {selectedSupplier.business_registration_number}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Contact Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <strong>Contact Person:</strong> {selectedSupplier.contact_name}
                                      </div>
                                      <div className="flex items-center">
                                        <Phone className="w-4 h-4 mr-2" />
                                        {selectedSupplier.phone}
                                      </div>
                                      <div className="flex items-center">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {selectedSupplier.email}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleApprove(selectedSupplier.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Supplier
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleSuspend(selectedSupplier.id)}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Application
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(supplier.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleSuspend(supplier.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>Active Suppliers</CardTitle>
          <CardDescription>
            Currently approved and operating suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading suppliers...</div>
          ) : activeSuppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active suppliers found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.address}</div>
                    </TableCell>
                    <TableCell>{supplier.contact_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1" />
                          {supplier.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1" />
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspend(supplier.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Suspend
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

export default SupplierApproval;
