'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useToast } from '@/hooks/use-toast';
import {
  getTrustFeatures,
  createTrustFeature,
  updateTrustFeature,
  deleteTrustFeature,
  type TrustFeature,
  type TrustFeatureInput,
} from '@/lib/api/site-content';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';

export function TrustFeaturesManager() {
  const [features, setFeatures] = useState<TrustFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<TrustFeature | null>(null);
  const [formData, setFormData] = useState<TrustFeatureInput>({
    title: '',
    icon: '✨',
    description: '',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    sortOrder: 0,
    isActive: true,
  });
  const { toast } = useToast();

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await getTrustFeatures(true);
      if (response.success && response.data) {
        setFeatures(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trust features',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleOpenDialog = (feature?: TrustFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        title: feature.title,
        icon: feature.icon,
        description: feature.description || '',
        color: feature.color,
        bgColor: feature.bgColor,
        sortOrder: feature.sortOrder,
        isActive: feature.isActive,
      });
    } else {
      setEditingFeature(null);
      setFormData({
        title: '',
        icon: '✨',
        description: '',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        sortOrder: features.length,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFeature(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFeature) {
        await updateTrustFeature(editingFeature.id, formData);
        toast({
          title: 'Success',
          description: 'Trust feature updated successfully',
        });
      } else {
        await createTrustFeature(formData);
        toast({
          title: 'Success',
          description: 'Trust feature created successfully',
        });
      }
      handleCloseDialog();
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingFeature ? 'update' : 'create'} trust feature`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmAction({
      title: 'Delete trust feature?',
      description: 'This trust feature will be permanently removed.',
      confirmLabel: 'Delete feature',
      variant: 'danger',
    }))) return;
    try {
      await deleteTrustFeature(id);
      toast({
        title: 'Success',
        description: 'Trust feature deleted successfully',
      });
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete trust feature',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trust Features</h2>
          <p className="text-sm text-slate-500 mt-1">Manage features displayed in the trust section</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Feature
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Icon
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Colors
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {features.map((feature) => (
                <tr key={feature.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{feature.sortOrder}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.bgColor}`}>
                      <span className="text-xl">{feature.icon}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{feature.title}</div>
                    {feature.description && (
                      <div className="text-xs text-slate-500 mt-1">{feature.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {feature.color}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {feature.bgColor}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feature.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {feature.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(feature)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(feature.id)}
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingFeature ? 'Edit' : 'Add'} Trust Feature</DialogTitle>
              <DialogDescription>
                {editingFeature ? 'Update' : 'Create a new'} trust feature for the landing page
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., মেরা কনটেন্ট"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji) *</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  required
                  placeholder="e.g., 💎"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Text Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., text-indigo-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <Input
                    id="bgColor"
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    placeholder="e.g., bg-indigo-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (visible on landing page)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingFeature ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
