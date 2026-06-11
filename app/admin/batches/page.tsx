'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBatches,
  getBatchById,
  deleteBatch,
  type Batch,
  type BatchStatusType,
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
  Plus,
  RefreshCw,
  Search,
  Trash2,
  MapPin,
  BookOpen,
  LayoutGrid,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { BatchForm } from '@/features/admin/batches';
import { BatchDetailsView } from '@/features/admin/batches';
import { BatchRoutineModal } from '@/features/admin/batches';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';
import { useAdminFilterOptions } from '@/lib/query/hooks/useAdminFilterOptions';

const statusOptions: (BatchStatusType | 'all')[] = ['all', 'ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (status === 'INACTIVE') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export default function BatchesPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const { courses: filterCourses, branches: filterBranches } = useAdminFilterOptions();

  const courses = useMemo(
    () =>
      filterCourses.map((course) => ({
        id: course.id,
        name: course.name,
        programId: course.programId,
      })) as Course[],
    [filterCourses],
  );
  const branches = useMemo(
    () => filterBranches.map((branch) => ({ id: branch.id, name: branch.name })) as Branch[],
    [filterBranches],
  );

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusType | 'all'>('ACTIVE');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [scopedBranchId, setScopedBranchId] = useState<string | null>(null);
  const [branchScopeReady, setBranchScopeReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      const branchAdmin = user?.role === 'BRANCH_ADMIN';
      const ownBranch = user?.branchId ? String(user.branchId) : null;
      setScopedBranchId(branchAdmin ? ownBranch : null);
      if (branchAdmin && ownBranch) {
        setBranchFilter(ownBranch);
      }
    } catch {
      setScopedBranchId(null);
    } finally {
      setBranchScopeReady(true);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Parameters<typeof getBatches>[0] = {};
      if (courseFilter !== 'all') params.courseId = courseFilter;
      if (scopedBranchId) params.branchId = scopedBranchId;
      else if (branchFilter !== 'all') params.branchId = branchFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await getBatches({ ...params, all: true });
      if (response.success && response.data) {
        setBatches(response.data || []);
      } else {
        setBatches([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, courseFilter, scopedBranchId, statusFilter]);

  useEffect(() => {
    if (!branchScopeReady) return;
    loadBatches();
  }, [branchScopeReady, loadBatches]);

  const handleViewBatch = async (id: string) => {
    try {
      const response = await getBatchById(id);
      if (response.success && response.data) {
        openModal({
          title: 'Batch Details',
          description: 'View batch details.',
          className: 'w-[calc(100vw-1rem)] sm:max-w-4xl',
          content: <BatchDetailsView batch={response.data} />,
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load batch details', variant: 'destructive' });
    }
  };

  const handleRoutineBatch = async (id: string) => {
    try {
      const response = await getBatchById(id);
      if (response.success && response.data) {
        const b = response.data;
        openModal({
          title: 'Batch Routine',
          description: 'View weekly class times for this batch.',
          className: 'w-[calc(100vw-1rem)] sm:max-w-3xl',
          content: (
            <BatchRoutineModal
              batchId={b.id}
              batchName={b.name}
              courseName={b.course?.name}
              branchId={b.branchId}
            />
          ),
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to open routine', variant: 'destructive' });
    }
  };

  const handleEditBatch = async (id: string) => {
    try {
      const response = await getBatchById(id);
      if (response.success && response.data) {
        openModal({
          title: 'Edit Batch',
          description: 'Update batch details.',
          className: 'w-[calc(100vw-1rem)] sm:max-w-2xl',
          content: <BatchForm courses={courses} branches={branches} batch={response.data} onSuccess={loadBatches} />,
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load batch for editing', variant: 'destructive' });
    }
  };

  const handleCreateBatch = () => {
    openModal({
      title: 'Create Batch',
      description: 'Add a new batch for a course and branch.',
      className: 'w-[calc(100vw-1rem)] sm:max-w-2xl',
      content: <BatchForm courses={courses} branches={scopedBranchId ? branches.filter((b) => b.id === scopedBranchId) : branches} onSuccess={loadBatches} />,
    });
  };

  const handleDeleteBatch = async (id: string) => {
    openModal({
      title: 'Delete Batch',
      description: 'This will remove the batch and may affect linked students and schedules.',
      className: 'w-[calc(100vw-1rem)] sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Are you sure you want to delete this batch?"
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteBatch(id);
              await loadBatches();
              toast({ title: 'Success', description: 'Batch deleted successfully', variant: 'success' });
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const filteredBatches = batches.filter((batch) => {
    const q = searchQuery.toLowerCase();
    return !q || batch.name.toLowerCase().includes(q) || 
           batch.course?.name.toLowerCase().includes(q) || 
           batch.branch?.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 text-slate-900 sm:space-y-8">
      {/* Filter Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_48px] lg:items-center">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search batches, courses, or branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner sm:text-base"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BatchStatusType | 'all')}>
              <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Status' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-sm font-medium">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!scopedBranchId && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="all" className="text-sm font-medium">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="text-sm font-medium">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" className="h-12 w-full rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm sm:w-12" onClick={loadBatches}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2 text-xs font-bold uppercase tracking-widest sm:hidden">Refresh</span>
            </Button>
          </div>

          <Button
            className="h-12 w-full rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 sm:w-auto"
            onClick={handleCreateBatch}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Batch List</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">All batches</p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {filteredBatches.length} Batches
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 p-12 text-center sm:p-20">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading batches...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center sm:p-20">
             <p className="font-black text-xs uppercase tracking-[0.2em] text-rose-500">{error}</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center sm:p-20">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No batches found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-6 font-black text-xs uppercase tracking-widest text-slate-400 sm:px-8">Batch</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Course & Branch</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">Dates</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-6 py-5 sm:px-8">
                       <div className="flex flex-col">
                          <span className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{batch.name}</span>
                          <span className="text-sm font-medium text-slate-400">ID: {batch.id.slice(0, 8)}...</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <BookOpen className="h-3 w-3 text-indigo-500" />
                             {batch.course?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
                             <MapPin className="h-4 w-4 text-rose-500" />
                             {batch.branch?.name}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={cn("rounded-lg text-xs font-black uppercase tracking-widest px-2.5 py-1", getStatusBadgeClass(String(batch.status)))}>
                            {batch.status}
                          </Badge>
                          <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest px-2.5 py-1">
                            {batch._count?.enrollments || 0} enrolled
                          </Badge>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-400">Starts: {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'TBA'}</span>
                          <span className="text-sm font-bold text-slate-500">Ends: {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Continuous'}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex flex-wrap justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewBatch(batch.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm"
                            onClick={() => handleRoutineBatch(batch.id)}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Routine
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditBatch(batch.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteBatch(batch.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
