'use client';

import { useEffect, useState } from 'react';
import { getPrograms } from '@/lib/api/programs';
import { getCourseById, getCourses, updateCourse, createCourse } from '@/lib/api/courses';
import {
  getCourseContents,
  createCourseContent,
  deleteCourseContent,
} from '@/lib/api/course-contents';
import {
  AdmissionStatus,
  BillingType,
  Course,
  CourseDetails,
  CourseStatus,
  CourseType,
  CreateCourseDto,
  GetCoursesParams,
  Program,
  UpdateCourseDto,
} from '@/types/course';
import {
  CourseContent,
  ContentType,
  CreateCourseContentDto,
  CourseOutline,
} from '@/types/course-content';
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
  BookOpenCheck,
  CalendarClock,
  Download,
  ExternalLink,
  FileText,
  FileVideo,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { CreateCourseForm } from '@/components/admin/courses/CreateCourseForm';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { CourseDetailsView } from '@/components/admin/courses/CourseDetailsView';
import { CourseStats } from '@/components/admin/courses/CourseStats';
import { cn } from '@/lib/utils';

const statusOptions: (CourseStatus | 'all')[] = ['all', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: (CourseType | 'all')[] = ['all', 'ONLINE', 'OFFLINE', 'HYBRID'];
const billingOptions: BillingType[] = ['ONE_TIME', 'MONTHLY'];
const admissionOptions: AdmissionStatus[] = ['OPEN', 'CLOSED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold';
  if (status === 'DISABLED') return 'bg-amber-50 text-amber-700 border-amber-100 font-bold';
  if (status === 'ARCHIVED') return 'bg-slate-100 text-slate-600 border-slate-200 font-bold';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getTypeBadgeClass(type: string) {
  if (type === 'ONLINE') return 'bg-blue-50 text-blue-700 border-blue-100 font-bold';
  if (type === 'OFFLINE') return 'bg-violet-50 text-violet-700 border-violet-100 font-bold';
  if (type === 'HYBRID') return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 font-bold';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function CoursesPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CourseType | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: GetCoursesParams = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await getCourses(params);

      if (response.success && response.data) {
        let filteredCourses = response.data;
        if (searchQuery.trim()) {
          filteredCourses = filteredCourses.filter(
            (course) =>
              course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.program?.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (typeFilter !== 'all') {
          filteredCourses = filteredCourses.filter((course) => course.type === typeFilter);
        }
        setCourses(filteredCourses);
        if (response.pagination) setPagination(response.pagination);
      } else {
        setCourses([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await getPrograms();
      if (response.success && response.data) setPrograms(response.data);
    } catch {
      setPrograms([]);
    }
  };

  const handleViewCourse = async (courseId: string) => {
    try {
      const response = await getCourseById(courseId);
      if (response.success && response.data) {
        openModal({
          title: 'Course Intelligence',
          description: 'Detailed view of course performance and metadata.',
          className: 'sm:max-w-4xl',
          content: <CourseDetailsView course={response.data as CourseDetails} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load course details', variant: 'destructive' });
    }
  };

  const handleEditCourse = async (courseId: string) => {
    try {
      const response = await getCourseById(courseId);
      if (response.success && response.data) {
        openModal({
          title: 'Update Course',
          description: 'Modify course structure, pricing, or status.',
          className: 'sm:max-w-4xl',
          content: <CourseForm programs={programs} course={response.data as CourseDetails} onSuccess={loadCourses} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load course for editing', variant: 'destructive' });
    }
  };

  const handleCreateCourse = () => {
    openModal({
      title: 'Deploy New Course',
      description: 'Configure a new course for the institutional curriculum.',
      className: 'sm:max-w-4xl',
      content: <CourseForm programs={programs} onSuccess={loadCourses} />,
    });
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { loadCourses(); }, [pagination.page, statusFilter]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) loadCourses();
      else setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter]);

  const totalVisible = courses.length;
  const activeCount = courses.filter((course) => course.status === 'ACTIVE').length;
  const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0);
  const featuredCount = courses.filter((course) => course.featured).length;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-indigo-100/50 shadow-sm">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Course Workspace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Course <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Management</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Manage structure, visibility, billing, and curriculum of all courses from one unified premium workspace.
            </p>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateCourse}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <CourseStats
        stats={[
          { label: 'Visible Rows', value: totalVisible, color: 'from-blue-600 to-cyan-500' },
          { label: 'Active Courses', value: activeCount, color: 'from-emerald-600 to-teal-500' },
          { label: 'Enrollments', value: totalEnrollments, color: 'from-indigo-600 to-purple-600' },
          { label: 'Featured', value: featuredCount, color: 'from-rose-600 to-pink-600' },
        ]}
      />

      {/* Search & Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative flex flex-wrap gap-4">
          <div className="min-w-[300px] flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search courses by name, code, or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 shadow-sm focus:ring-4 focus:ring-indigo-500/10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-xl">
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-bold text-xs uppercase tracking-widest">
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 shadow-sm focus:ring-4 focus:ring-indigo-500/10">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-xl">
              {typeOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-bold text-xs uppercase tracking-widest">
                  {opt === 'all' ? 'All Types' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            onClick={loadCourses}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Course Registry</h2>
            <p className="mt-0.5 text-xs font-bold text-indigo-500">Live system database</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {pagination.total} Total Records
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No records found in current view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Code</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Course Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Program</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Modality</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pricing</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 font-mono text-[11px] font-black text-indigo-600 uppercase tracking-tighter">{course.code}</TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{course.name}</span>
                          <span className="text-[10px] font-medium text-slate-400">ID: {course.id.slice(0, 8)}...</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-500">{course.program?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm", getTypeBadgeClass(course.type))}>
                        {course.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900">৳{Number(course.fee).toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{course.billingType}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm", getStatusBadgeClass(course.status))}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          onClick={() => handleViewCourse(course.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          onClick={() => handleEditCourse(course.id)}
                        >
                          Edit
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
            Viewing Page <span className="text-indigo-600">{pagination.page}</span> / {pagination.pages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}