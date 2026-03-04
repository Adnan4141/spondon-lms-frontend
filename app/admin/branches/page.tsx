'use client';

import { useEffect, useState } from 'react';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  type Branch,
  type CreateBranchDto,
  type UpdateBranchDto,
} from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const statusOptions = ['all', 'active', 'inactive'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BranchesPage() {
  const { toast, toasts, removeToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [branchDetails, setBranchDetails] = useState<Branch | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<CreateBranchDto>({
    name: '',
    code: '',
    address: '',
    phone: '',
    status: 'active',
  });
  const [createForm, setCreateForm] = useState<CreateBranchDto>({
    name: '',
    code: '',
    address: '',
    phone: '',
    status: 'active',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data);
      } else {
        setError(response.message || 'Failed to load branches');
        setBranches([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load branches');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const fetchBranchDetails = async (branchId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getBranchById(branchId);

      if (response.success && response.data) {
        setBranchDetails(response.data);
        const branch = response.data;
        setEditForm({
          name: branch.name,
          code: branch.code || '',
          address: branch.address || '',
          phone: branch.phone || '',
          status: branch.status,
        });
        return response.data;
      }

      throw new Error(response.message || 'Failed to load branch details');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setDetailsError(message);
      setBranchDetails(null);
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewBranch = async (branchId: string) => {
    setViewDialogOpen(true);
    await fetchBranchDetails(branchId);
  };

  const handleEditBranch = async (branchId: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchBranchDetails(branchId);
  };

  const handleEditSubmit = async () => {
    if (!branchDetails) return;

    if (!editForm.name.trim()) {
      setEditError('Branch name is required');
      toast({
        title: 'Error',
        description: 'Branch name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateBranchDto = {
        name: editForm.name.trim(),
        code: editForm.code?.trim() || undefined,
        address: editForm.address?.trim() || undefined,
        phone: editForm.phone?.trim() || undefined,
        status: editForm.status,
      };

      await updateBranch(branchDetails.id, payload);
      setEditDialogOpen(false);
      await loadBranches();

      toast({
        title: 'Success',
        description: 'Branch updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to update branch';
      setEditError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!createForm.name.trim()) {
      setCreateError('Branch name is required');
      toast({
        title: 'Error',
        description: 'Branch name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const payload: CreateBranchDto = {
        name: createForm.name.trim(),
        code: createForm.code?.trim() || undefined,
        address: createForm.address?.trim() || undefined,
        phone: createForm.phone?.trim() || undefined,
        status: createForm.status || 'active',
      };

      await createBranch(payload);
      setCreateDialogOpen(false);
      setCreateForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        status: 'active',
      });
      await loadBranches();

      toast({
        title: 'Success',
        description: 'Branch created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to create branch';
      setCreateError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBranch(branchId);
      await loadBranches();

      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      (branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.address?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === 'all' || branch.status.toLowerCase() === statusFilter.toLowerCase())
  );

  const isDetailsReady = !detailsLoading && branchDetails !== null;
  const totalBranches = branches.length;
  const activeCount = branches.filter((b) => b.status.toLowerCase() === 'active').length;
  const totalUsers = branches.reduce((sum, b) => sum + (b._count?.users || 0), 0);
  const totalBatches = branches.reduce((sum, b) => sum + (b._count?.batches || 0), 0);
  const totalEnrollments = branches.reduce((sum, b) => sum + (b._count?.enrollments || 0), 0);

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Branch Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage all branches, their details, and access permissions.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Branch
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Branches</p>
          <p className="mt-2 text-2xl font-semibold">{totalBranches}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Active Branches</p>
          <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Users</p>
          <p className="mt-2 text-2xl font-semibold">{totalUsers}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Batches</p>
          <p className="mt-2 text-2xl font-semibold">{totalBatches}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search branches by name, code, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Status' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={loadBranches}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <section className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Branch Catalog</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all registered branches</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Building2 className="h-4 w-4" />
            <span>{totalBranches} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading branches...</div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No branches found matching your search.' : 'No branches found. Create your first branch.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch) => (
                <TableRow key={branch.id} className="hover:bg-muted/45">
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>
                    {branch.code ? <Badge variant="outline">{branch.code}</Badge> : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{branch.address || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{branch.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={branch.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                      {branch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{branch._count?.users || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{branch._count?.batches || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{branch._count?.enrollments || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewBranch(branch.id)}
                        title="View Branch"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBranch(branch.id)}
                        title="Edit Branch"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBranch(branch.id)}
                        title="Delete Branch"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Create Branch Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Branch</DialogTitle>
            <DialogDescription>Add a new branch to the system.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Branch Name *</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter branch name"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch Code</label>
                  <Input
                    value={createForm.code}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter branch code (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={createForm.status}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={createForm.address}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter branch address (optional)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {createError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Branch Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Branch Details</DialogTitle>
            <DialogDescription>View complete branch information and statistics.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && branchDetails && (
              <div className="space-y-5 text-sm py-6">
                {/* Basic Information */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch Name</p>
                      <p className="mt-1 font-medium">{branchDetails.name}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch Code</p>
                      <p className="mt-1 font-medium">{branchDetails.code || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="mt-1">
                        <Badge variant={branchDetails.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                          {branchDetails.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Phone</p>
                      <p className="mt-1 font-medium">{branchDetails.phone || '-'}</p>
                    </div>
                  </div>
                  {branchDetails.address && (
                    <div className="rounded-lg border bg-muted/20 p-3 mt-3">
                      <p className="text-xs uppercase text-muted-foreground">Address</p>
                      <p className="mt-1 font-medium">{branchDetails.address}</p>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Statistics</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs uppercase text-muted-foreground">Total Users</p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">{branchDetails._count?.users || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs uppercase text-muted-foreground">Total Batches</p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">{branchDetails._count?.batches || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs uppercase text-muted-foreground">Total Enrollments</p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">{branchDetails._count?.enrollments || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Users */}
                {branchDetails.users && branchDetails.users.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Users</p>
                    <div className="space-y-2">
                      {branchDetails.users.map((user) => (
                        <div key={user.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{user.email || user.role}</p>
                            </div>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm">
                        {new Date(branchDetails.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Updated At</p>
                      <p className="mt-1 text-sm">
                        {new Date(branchDetails.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>Update branch information and save the changes.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading form...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && (
              <div className="space-y-4 py-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch Name *</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter branch name"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Branch Code</label>
                    <Input
                      value={editForm.code}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Enter branch code (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter branch address (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number (optional)"
                  />
                </div>

                {editError && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    {editError}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editSubmitting || !isDetailsReady}>
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
