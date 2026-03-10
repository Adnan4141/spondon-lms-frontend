'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import {
  getEnrollments,
  getEnrollmentById,
  deleteEnrollment,
  type Enrollment,
  type EnrollmentStatusType,
} from '@/lib/api/enrollments';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { Batch } from '@/lib/api/batches';
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
  CalendarClock,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Activity,
  CheckCircle2,
  Clock as ClockIcon,
  Building2,
  BookOpenCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { EnrollmentForm } from '@/components/admin/enrollments/EnrollmentForm';
import { EnrollmentDetailsView } from '@/components/admin/enrollments/EnrollmentDetailsView';
import { cn } from '@/lib/utils';

const statusOptions: (EnrollmentStatusType | 'all')[] = ['all', 'ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (s === 'PAUSED') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  if (s === 'COMPLETED') return 'bg-indigo-50 text-indigo-700 border-indigo-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export default function EnrollmentsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatusType | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) setCourses(response.data);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) setBranches(response.data);
    } catch (err) { console.error(err); }
  };

  const loadBatches = async (courseId?: string, branchId?: string) => {
    try {
      const params: any = {};
      if (courseId && courseId !== 'all') params.courseId = courseId;
      if (branchId && branchId !== 'all') params.branchId = branchId;
      const response = await getBatches(params);
      if (response.success && response.data) setBatches(response.data);
      else setBatches([]);
    } catch (err) { console.error(err); }
  };

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (courseFilter !== 'all') params.courseId = courseFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      if (batchFilter !== 'all') params.batchId = batchFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await getEnrollments(params);
      if (response.success && response.data) setEnrollments(response.data);
      else setEnrollments([]);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadBranches();
    loadEnrollments();
  }, []);

  useEffect(() => {
    loadBatches(courseFilter, branchFilter);
    loadEnrollments();
  }, [courseFilter, branchFilter, batchFilter, statusFilter]);

  const handleViewEnrollment = async (id: string) => {
    try {
      const res = await getEnrollmentById(id);
      if (res.success && res.data) {
        openModal({
          title: 'Enrollment Intelligence',
          description: 'Detailed lifecycle, billing, and academic mapping.',
          className: 'sm:max-w-4xl',
          content: <EnrollmentDetailsView enrollment={res.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load enrollment details', variant: 'destructive' });
    }
  };

  const handleEditEnrollment = async (id: string) => {
    try {
      const res = await getEnrollmentById(id);
      if (res.success && res.data) {
        openModal({
          title: 'Update Enrollment Status',
          description: 'Modify lifecycle state or billing configurations.',
          className: 'sm:max-w-2xl',
          content: <EnrollmentForm enrollment={res.data} onSuccess={loadEnrollments} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load enrollment for editing', variant: 'destructive' });
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) return;
    try {
      await deleteEnrollment(id);
      await loadEnrollments();
      toast({ title: 'Success', description: 'Enrollment record deleted successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      e.student?.fullName.toLowerCase().includes(q) ||
      e.student?.mobile.includes(searchQuery) ||
      e.course?.name.toLowerCase().includes(q) ||
      e.branch?.name.toLowerCase().includes(q)
    );
  });

  const stats = [
    { label: 'Total Volume', value: enrollments.length, color: 'from-blue-600 to-cyan-500', icon: GraduationCap },
    { label: 'Active Learners', value: enrollments.filter(e => String(e.status) === 'ACTIVE').length, color: 'from-emerald-600 to-teal-500', icon: Sparkles },
    { label: 'Paused Tracks', value: enrollments.filter(e => String(e.status) === 'PAUSED').length, color: 'from-amber-600 to-orange-500', icon: ClockIcon },
    { label: 'Cancelled', value: enrollments.filter(e => String(e.status) === 'CANCELLED').length, color: 'from-rose-600 to-pink-600', icon: Trash2 },
  ];

  return (
    <div className="space-y-8 text-slate-900">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-indigo-100/50 shadow-sm">
              <CalendarClock className="h-3.5 w-3.5" />
              Enrollment Workspace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Registry <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Operations</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Manage student enrollments, track lifecycle transitions, and coordinate batch/branch assignments across the institution.
            </p>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={() => window.open('/admin/enrollments/change', '_blank')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Batch / Branch Change
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[300px] flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search by student, mobile, course, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 shadow-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-bold text-xs uppercase tracking-widest py-3">
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadEnrollments}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-[10px] uppercase tracking-widest text-slate-500">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Courses</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase py-2">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-[10px] uppercase tracking-widest text-slate-500">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
              {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-[10px] uppercase tracking-widest text-slate-500">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Batches</SelectItem>
              {batches.map(b => <SelectItem key={b.id} value={b.id} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollment Registry</h2>
            <p className="mt-0.5 text-xs font-bold text-indigo-500">Institutional track database</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {enrollments.length} Active Records
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No matching enrollments identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Academic Context</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch & Batch</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((e) => (
                  <TableRow key={e.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-xs">
                             {e.student?.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{e.student?.fullName}</span>
                             <span className="text-[10px] font-medium text-slate-400">{e.student?.mobile}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{e.course?.name}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code: {e.course?.code}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                             <Building2 className="h-3 w-3 text-rose-500" />
                             {e.branch?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                             <Users className="h-3 w-3 text-indigo-400" />
                             {e.batch?.name || 'Unassigned'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-1", getStatusBadgeClass(String(e.status)))}>
                         {e.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewEnrollment(e.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditEnrollment(e.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteEnrollment(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
