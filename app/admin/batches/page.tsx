'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
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
  Calendar,
  CalendarClock,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Layout,
  Layers,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { BatchForm } from '@/components/admin/batches/BatchForm';
import { BatchDetailsView } from '@/components/admin/batches/BatchDetailsView';
import { cn } from '@/lib/utils';

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

  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusType | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) setCourses(response.data || []);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) setBranches(response.data || []);
    } catch (err) { console.error(err); }
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
        setBatches([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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
  }, [statusFilter, courseFilter, branchFilter]);

  const handleViewBatch = async (id: string) => {
    try {
      const response = await getBatchById(id);
      if (response.success && response.data) {
        openModal({
          title: 'Batch Intelligence',
          description: 'Detailed analytics and operational overview of the batch.',
          className: 'sm:max-w-4xl',
          content: <BatchDetailsView batch={response.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load batch details', variant: 'destructive' });
    }
  };

  const handleEditBatch = async (id: string) => {
    try {
      const response = await getBatchById(id);
      if (response.success && response.data) {
        openModal({
          title: 'Update Operational Batch',
          description: 'Modify batch identity, schedule, and capacity.',
          className: 'sm:max-w-2xl',
          content: <BatchForm courses={courses} branches={branches} batch={response.data} onSuccess={loadBatches} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load batch for editing', variant: 'destructive' });
    }
  };

  const handleCreateBatch = () => {
    openModal({
      title: 'Authorize New Batch',
      description: 'Initialize a new operational batch for a specific course and branch.',
      className: 'sm:max-w-2xl',
      content: <BatchForm courses={courses} branches={branches} onSuccess={loadBatches} />,
    });
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return;
    try {
      await deleteBatch(id);
      await loadBatches();
      toast({ title: 'Success', description: 'Batch deleted successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const q = searchQuery.toLowerCase();
    return !q || batch.name.toLowerCase().includes(q) || 
           batch.course?.name.toLowerCase().includes(q) || 
           batch.branch?.name.toLowerCase().includes(q);
  });

  const totalBatches = batches.length;
  const activeCount = batches.filter((b) => String(b.status) === 'ACTIVE').length;
  const totalEnrollments = batches.reduce((sum, b) => sum + (b._count?.enrollments || 0), 0);
  const totalSessions = batches.reduce((sum, b) => sum + (b._count?.classSessions || 0), 0);

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Batches', value: totalBatches, color: 'from-blue-600 to-cyan-500', icon: Layout },
          { label: 'Active Status', value: activeCount, color: 'from-emerald-600 to-teal-500', icon: Layers },
          { label: 'Enrollments', value: totalEnrollments, color: 'from-indigo-600 to-purple-600', icon: Users },
          { label: 'Total Sessions', value: totalSessions, color: 'from-rose-600 to-pink-600', icon: CalendarClock },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search batches, courses, or branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
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
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
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

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadBatches}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateBatch}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Batch Inventory</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Live operational data</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalBatches} Operational Batches
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No matching batches identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-sm uppercase tracking-widest text-slate-400">Batch Identity</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Course & Context</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Operational Info</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Timeline</TableHead>
                  <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
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
                       <div className="flex justify-center gap-2">
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
