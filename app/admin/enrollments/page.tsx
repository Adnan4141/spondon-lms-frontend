'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import {
  getEnrollments,
  getEnrollmentById,
  deleteEnrollment,
  settleEnrollment,
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
  Layers,
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
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';

const statusOptions: (EnrollmentStatusType | 'all')[] = ['all', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'CANCELLED', 'COMPLETED', 'PENDING_PAYMENT', 'EXPIRED'];

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
  if (s === 'SUSPENDED') return 'bg-orange-50 text-orange-700 border-orange-200 font-black';
  if (s === 'PENDING_PAYMENT') return 'bg-orange-50 text-orange-700 border-orange-200 font-black';
  if (s === 'EXPIRED') return 'bg-red-50 text-red-700 border-red-200 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

function statusLabel(status: string): string {
  const s = String(status).toUpperCase();
  if (s === 'PENDING_PAYMENT') return 'পেমেন্ট বাকি';
  if (s === 'EXPIRED') return 'মেয়াদোত্তীর্ণ';
  return s;
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bid = new URLSearchParams(window.location.search).get('branchId');
    if (bid) setBranchFilter(bid);
  }, []);

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
          title: 'Enrollment Details',
          description: 'View enrollment info.',
          className: 'sm:max-w-4xl',
          content: (
            <EnrollmentDetailsView
              enrollment={res.data}
              onRequestSettle={() => handleSettleEnrollment(id)}
              onAfterMutation={loadEnrollments}
            />
          ),
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
          title: 'Edit Enrollment',
          description: 'Update enrollment details.',
          className: 'sm:max-w-2xl',
          content: <EnrollmentForm enrollment={res.data} onSuccess={loadEnrollments} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load enrollment for editing', variant: 'destructive' });
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    openModal({
      title: 'Delete Enrollment',
      description: 'Delete this enrollment? This cannot be undone.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Delete this enrollment permanently?"
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteEnrollment(id);
              await loadEnrollments();
              toast({ title: 'Success', description: 'Enrollment record deleted successfully', variant: 'success' });
            } catch (err: unknown) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const handleSettleEnrollment = async (id: string) => {
    openModal({
      title: 'Settle Enrollment',
      description: 'Settle all dues for this enrollment.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Settlement"
          description="Settle outstanding dues for this enrollment?"
          variant="info"
          onConfirm={async () => {
            try {
              setLoading(true);
              const res = await settleEnrollment(id);
              if (res.success) {
                toast({ title: 'Settled', description: res.message || 'Dues cleared.', variant: 'success' });
                await loadEnrollments();
              } else {
                toast({ title: 'Settlement Failed', description: res.message || 'Could not settle.', variant: 'destructive' });
              }
            } catch (err: unknown) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            } finally {
              setLoading(false);
            }
          }}
        />
      ),
    });
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

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
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
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Status' : statusLabel(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadEnrollments}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={() => window.open('/admin/enrollments/change', '_blank')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Change Batch / Branch
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
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollments</h2>
            <p className="mt-0.5 text-sm font-bold text-indigo-500">Student enrollments only</p>
            <p className="mt-1 max-w-xl text-xs font-medium text-slate-500">
              Rows are enrollments where the user is a <strong>Student</strong>. Teachers assigned to courses are not listed as
              students.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Enrollments
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading enrollments...</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No enrollments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Student</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Course</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Delivery</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch / Batch</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((e) => (
                  <TableRow key={e.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-base">
                             {e.student?.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{e.student?.fullName}</span>
                             <span className="text-base font-medium text-slate-400">{e.student?.mobile}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{e.course?.name}</span>
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Code: {e.course?.slug}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <CourseDeliveryBadge type={e.course?.type} className="text-[9px]" />
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                             <Building2 className="h-3.5 w-3.5 text-rose-500" />
                             {e.branch?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
                             <Users className="h-3.5 w-3.5 text-indigo-400" />
                             {e.batch?.name || 'Unassigned'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-1", getStatusBadgeClass(String(e.status)))}>
                         {statusLabel(String(e.status))}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-emerald-200 bg-emerald-50/50 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                            onClick={() => handleSettleEnrollment(e.id)}
                            title="Settle Outstanding Dues"
                          >
                            <CheckCircle2 className="mr-1.5 h-3 w-3" />
                            Settle
                          </Button>
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
