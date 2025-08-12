
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus, Trash2, MapPin, Ruler } from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  location: string;
  size: number;
  size_unit: string;
  livestock_type: string;
  details?: string;
  created_at: string;
}

const FarmManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    size: '',
    size_unit: 'hectares',
    livestock_type: '',
    details: ''
  });

  useEffect(() => {
    fetchFarms();
  }, [user]);

  const fetchFarms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
      toast({
        title: "Error",
        description: "Failed to load farms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const farmData = {
        ...formData,
        size: parseFloat(formData.size),
        farmer_id: user.id
      };

      let error;
      if (editingFarm) {
        const { error: updateError } = await supabase
          .from('farms')
          .update(farmData)
          .eq('id', editingFarm.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('farms')
          .insert([farmData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingFarm ? "Farm Updated" : "Farm Created",
        description: `${formData.name} has been ${editingFarm ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      fetchFarms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      location: farm.location,
      size: farm.size.toString(),
      size_unit: farm.size_unit,
      livestock_type: farm.livestock_type,
      details: farm.details || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (farm: Farm) => {
    if (!confirm(`Are you sure you want to delete ${farm.name}?`)) return;

    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farm.id);

      if (error) throw error;

      toast({
        title: "Farm Deleted",
        description: `${farm.name} has been deleted successfully.`,
      });

      fetchFarms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      size: '',
      size_unit: 'hectares',
      livestock_type: '',
      details: ''
    });
    setEditingFarm(null);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading farms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Farms</h2>
          <p className="text-gray-600">Manage your farm locations and details</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFarm(null)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFarm ? 'Edit Farm' : 'Add New Farm'}</DialogTitle>
              <DialogDescription>
                {editingFarm ? 'Update farm details' : 'Add a new farm to your portfolio'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Farm Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="District, Sector, Cell"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Input
                    id="size"
                    type="number"
                    step="0.1"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size_unit">Unit</Label>
                  <Select value={formData.size_unit} onValueChange={(value) => setFormData({...formData, size_unit: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hectares">Hectares</SelectItem>
                      <SelectItem value="acres">Acres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="livestock_type">Livestock Type *</Label>
                <Select value={formData.livestock_type} onValueChange={(value) => setFormData({...formData, livestock_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select livestock type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fish">Fish</SelectItem>
                    <SelectItem value="Cattle">Cattle</SelectItem>
                    <SelectItem value="Poultry">Poultry</SelectItem>
                    <SelectItem value="Goats">Goats</SelectItem>
                    <SelectItem value="Sheep">Sheep</SelectItem>
                    <SelectItem value="Pigs">Pigs</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Additional Details</Label>
                <Textarea
                  id="details"
                  placeholder="Any additional information about this farm..."
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingFarm ? 'Update Farm' : 'Create Farm'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {farms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No farms registered</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first farm</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Farm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <Card key={farm.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {farm.livestock_type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(farm)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(farm)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {farm.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Ruler className="w-4 h-4 mr-1" />
                  {farm.size} {farm.size_unit}
                </div>
                {farm.details && (
                  <p className="text-sm text-gray-600 mt-2">{farm.details}</p>
                )}
                <p className="text-xs text-gray-400">
                  Created: {new Date(farm.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmManagement;
