'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  type Batch,
  type BatchStatusType,
  type CreateBatchDto,
  type UpdateBatchDto,
} from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
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
  Calendar,
  CalendarClock,
  Edit,
  Eye,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const statusOptions: (BatchStatusType | 'all')[] = ['all', 'ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BatchesPage() {
  const { toast, toasts, removeToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusType | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [batchDetails, setBatchDetails] = useState<Batch | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateBatchDto>({
    courseId: '',
    branchId: '',
    name: '',
    startDate: '',
    endDate: '',
    capacity: undefined,
    status: 'ACTIVE',
  });
  const [editForm, setEditForm] = useState<CreateBatchDto>({
    courseId: '',
    branchId: '',
    name: '',
    startDate: '',
    endDate: '',
    capacity: undefined,
    status: 'ACTIVE',
  });

  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) {
        setCourses(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (courseFilter !== 'all') params.courseId = courseFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await getBatches(params);
      if (response.success && response.data) {
        setBatches(response.data || []);
      } else {
        setError(response.message || 'Failed to load batches');
        setBatches([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadBranches();
    loadBatches();
  }, []);

  useEffect(() => {
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, courseFilter, branchFilter]);

  const fetchBatchDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getBatchById(id);
      if (response.success && response.data) {
        const batch = response.data;
        setBatchDetails(batch);
        setEditForm({
          courseId: batch.courseId,
          branchId: batch.branchId,
          name: batch.name,
          startDate: batch.startDate ? batch.startDate.slice(0, 10) : '',
          endDate: batch.endDate ? batch.endDate.slice(0, 10) : '',
          capacity: batch.capacity ?? undefined,
          status: (batch.status as BatchStatusType) || 'ACTIVE',
        });
        return batch;
      }
      throw new Error(response.message || 'Failed to load batch details');
    } catch (err: unknown) {
      setBatchDetails(null);
      setDetailsError(getErrorMessage(err));
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewBatch = async (id: string) => {
    setViewDialogOpen(true);
    await fetchBatchDetails(id);
  };

  const handleEditBatch = async (id: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchBatchDetails(id);
  };

  const handleCreateSubmit = async () => {
    if (!createForm.name.trim() || !createForm.courseId || !createForm.branchId) {
      setCreateError('Name, course, and branch are required');
      toast({
        title: 'Error',
        description: 'Name, course, and branch are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const payload: CreateBatchDto = {
        courseId: createForm.courseId,
        branchId: createForm.branchId,
        name: createForm.name.trim(),
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
        capacity: createForm.capacity,
        status: createForm.status || 'ACTIVE',
      };
      await createBatch(payload);
      setCreateDialogOpen(false);
      setCreateForm({
        courseId: '',
        branchId: '',
        name: '',
        startDate: '',
        endDate: '',
        capacity: undefined,
        status: 'ACTIVE',
      });
      await loadBatches();
      toast({
        title: 'Success',
        description: 'Batch created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to create batch';
      setCreateError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!batchDetails) return;
    if (!editForm.name.trim() || !editForm.courseId || !editForm.branchId) {
      setEditError('Name, course, and branch are required');
      toast({
        title: 'Error',
        description: 'Name, course, and branch are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateBatchDto = {
        name: editForm.name.trim(),
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        capacity: editForm.capacity,
        status: editForm.status,
      };
      await updateBatch(batchDetails.id, payload);
      setEditDialogOpen(false);
      await loadBatches();
      toast({
        title: 'Success',
        description: 'Batch updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to update batch';
      setEditError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteBatch(id);
      await loadBatches();
      toast({
        title: 'Success',
        description: 'Batch deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete batch',
        variant: 'destructive',
      });
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const q = searchQuery.toLowerCase();
    const courseName = batch.course?.name.toLowerCase() || '';
    const branchName = batch.branch?.name.toLowerCase() || '';
    const name = batch.name.toLowerCase();
    return !q || name.includes(q) || courseName.includes(q) || branchName.includes(q);
  });

  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => String(b.status) === 'ACTIVE').length;
  const totalEnrollments = batches.reduce((sum, b) => sum + (b._count?.enrollments || 0), 0);
  const totalSessions = batches.reduce((sum, b) => sum + (b._count?.classSessions || 0), 0);

  const isDetailsReady = !!batchDetails && !detailsLoading;

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Batch Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage batches for each course and branch, including schedule, capacity, and lifecycle.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Batches</p>
          <p className="mt-2 text-2xl font-semibold">{totalBatches}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Active Batches</p>
          <p className="mt-2 text-2xl font-semibold">{activeBatches}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Enrollments</p>
          <p className="mt-2 text-2xl font-semibold">{totalEnrollments}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Class Sessions</p>
          <p className="mt-2 text-2xl font-semibold">{totalSessions}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search batches by name, course, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BatchStatusType | 'all')}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-10 w-[200px] border-border bg-background">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-10 w-[200px] border-border bg-background">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={loadBatches}>
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
            <h2 className="text-base font-semibold tracking-tight">Batch List</h2>
            <p className="text-xs text-muted-foreground">Browse and manage batches for all courses.</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Calendar className="h-4 w-4" />
            <span>{totalBatches} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading batches...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No batches found matching your search.' : 'No batches found. Create your first batch.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-muted/45">
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.course?.name || '-'}</TableCell>
                  <TableCell>{batch.branch?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        String(batch.status) === 'ACTIVE'
                          ? 'default'
                          : String(batch.status) === 'COMPLETED'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{batch._count?.enrollments || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{batch._count?.classSessions || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewBatch(batch.id)}
                        title="View Batch"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBatch(batch.id)}
                        title="Edit Batch"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBatch(batch.id)}
                        title="Delete Batch"
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

      {/* Create Batch Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Batch</DialogTitle>
            <DialogDescription>Add a new batch for a course and branch.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Batch name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course *</label>
                  <Select
                    value={createForm.courseId}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, courseId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch *</label>
                  <Select
                    value={createForm.branchId}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, branchId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={createForm.startDate || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={createForm.endDate || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <Input
                    type="number"
                    min="0"
                    value={createForm.capacity ?? ''}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        capacity: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="Max students"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={createForm.status || 'ACTIVE'}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, status: v as BatchStatusType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
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
              {createSubmitting ? 'Creating...' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Batch Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>View complete batch information and statistics.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}
            {isDetailsReady && batchDetails && (
              <div className="space-y-5 text-sm py-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Name</p>
                      <p className="mt-1 font-medium">{batchDetails.name}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="mt-1">
                        <Badge
                          variant={
                            String(batchDetails.status) === 'ACTIVE'
                              ? 'default'
                              : String(batchDetails.status) === 'COMPLETED'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {batchDetails.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Course</p>
                      <p className="mt-1 font-medium">{batchDetails.course?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch</p>
                      <p className="mt-1 font-medium">{batchDetails.branch?.name || '-'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Schedule</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Start Date</p>
                      <p className="mt-1 text-sm">
                        {batchDetails.startDate
                          ? new Date(batchDetails.startDate).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">End Date</p>
                      <p className="mt-1 text-sm">
                        {batchDetails.endDate
                          ? new Date(batchDetails.endDate).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Statistics</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Capacity</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {batchDetails.capacity ?? '-'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs uppercase text-muted-foreground">Enrollments</p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">
                        {batchDetails._count?.enrollments || 0}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs uppercase text-muted-foreground">Class Sessions</p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">
                        {batchDetails._count?.classSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm">
                        {new Date(batchDetails.createdAt).toLocaleString('en-US', {
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
                        {new Date(batchDetails.updatedAt).toLocaleString('en-US', {
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

      {/* Edit Batch Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>Update batch information and save the changes.</DialogDescription>
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
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Batch name"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course *</label>
                    <Select
                      value={editForm.courseId}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, courseId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Branch *</label>
                    <Select
                      value={editForm.branchId}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, branchId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={editForm.startDate || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={editForm.endDate || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Capacity</label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.capacity ?? ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          capacity: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      placeholder="Max students"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.status || 'ACTIVE'}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, status: v as BatchStatusType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                    </SelectContent>
                  </Select>
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

