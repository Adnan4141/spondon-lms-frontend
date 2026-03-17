'use client';

import { useEffect, useState } from 'react';
import { getExams, getExamById, deleteExam } from '@/lib/api/exams';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import type {
  Exam,
  ExamType,
  ExamMode,
  ExamStatus,
} from '@/types/exam';
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
  BookOpenCheck,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  FileText,
  Activity,
  Layers,
  History,
  Calendar,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ExamForm } from '@/components/admin/exams/ExamForm';
import { ExamDetailsView } from '@/components/admin/exams/ExamDetailsView';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';

const examTypeOptions: ExamType[] = ['PRACTICE', 'SCHEDULED', 'MODEL', 'TALENT_HUNT', 'UNIVERSITY'];
const examModeOptions: ExamMode[] = ['ONLINE', 'OFFLINE'];
const examStatusOptions: (ExamStatus | 'all')[] = ['all', 'DRAFT', 'PUBLISHED', 'CLOSED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'CLOSED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export default function ExamsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<ExamMode | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (modeFilter !== 'all') params.mode = modeFilter;
      if (courseFilter !== 'all') params.courseId = courseFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;

      const response = await getExams(params);
      if (response.success && response.data) {
        setExams(response.data);
      } else {
        setExams([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await getCourses({ status: 'ACTIVE', limit: 500 });
      if (res.success && res.data) setCourses(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async () => {
    try {
      const res = await getBranches();
      if (res.success && res.data) setBranches(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadExams();
    loadCourses();
    loadBranches();
  }, []);

  useEffect(() => {
    loadExams();
  }, [statusFilter, modeFilter, courseFilter, branchFilter]);

  const handleViewExam = async (examId: string) => {
    try {
      const res = await getExamById(examId);
      if (res.success && res.data) {
        openModal({
          title: 'Exam Details',
          description: 'View exam details.',
          className: 'sm:max-w-4xl',
          content: <ExamDetailsView exam={res.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load exam details', variant: 'destructive' });
    }
  };

  const handleEditExam = async (examId: string) => {
    try {
      const res = await getExamById(examId);
      if (res.success && res.data) {
        openModal({
          title: 'Update Exam Baseline',
          description: 'Refine exam scheduling and access rules.',
          className: 'sm:max-w-6xl',
          content: <ExamForm courses={courses} branches={branches} exam={res.data} onSuccess={loadExams} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load exam for editing', variant: 'destructive' });
    }
  };

  const handleCreateExam = () => {
        openModal({
          title: 'Create Exam',
          description: 'Add a new exam.',
      className: 'sm:max-w-6xl',
      content: <ExamForm courses={courses} branches={branches} onSuccess={loadExams} />,
    });
  };

  const handleDeleteExam = async (examId: string) => {
    openModal({
      title: 'Exam Deletion',
      description: 'Are you sure you want to permanently remove this exam? This action cannot be undone.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Are you sure you want to delete this exam? This action cannot be undone."
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteExam(examId);
              await loadExams();
              toast({ title: 'Success', description: 'Exam deleted successfully', variant: 'success' });
            } catch (err: unknown) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  placeholder="Search exams by title or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner outline-none"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-200 bg-white font-bold text-sm uppercase tracking-widest text-slate-600 shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {examStatusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="font-bold text-sm uppercase tracking-widest py-3">
                    {opt === 'all' ? 'All Status' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-12 w-[200px] rounded-2xl border-slate-200 bg-white font-bold text-sm uppercase tracking-widest text-slate-600 shadow-sm">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="font-bold text-sm uppercase tracking-widest py-3">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="font-bold text-sm uppercase tracking-widest py-3">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadExams}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateExam}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Exam
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-base font-black uppercase tracking-[0.2em] text-slate-400">Exams</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">All exams</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Exams
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No exams found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-base uppercase tracking-widest text-slate-400">Exam</TableHead>
                  <TableHead className="font-black text-base uppercase tracking-widest text-slate-400">Course</TableHead>
                  <TableHead className="font-black text-base uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="font-black text-base uppercase tracking-widest text-slate-400">Timeline</TableHead>
                  <TableHead className="px-8 font-black text-base uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.title}</span>
                          <span className="text-base font-medium text-slate-400">Ref: {exam.id.slice(0, 8)}...</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <BookOpen className="h-4 w-4 text-indigo-500" />
                             {exam.course?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-400">
                             <MapPin className="h-4 w-4 text-rose-500" />
                             {exam.branch?.name}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={cn("rounded-lg text-sm font-black uppercase px-2.5 py-1", getStatusBadgeClass(exam.status))}>
                            {exam.status}
                          </Badge>
                          <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-black text-sm uppercase px-2.5 py-1">
                            {exam.mode}
                          </Badge>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1">
                          <span className="text-base font-bold text-slate-400">Window: {exam.startAt ? new Date(exam.startAt).toLocaleDateString() : 'Immediate'}</span>
                          <span className="text-base font-bold text-slate-500">Attempts: {exam._count?.attempts || 0} logs</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-slate-200 bg-white px-4 text-sm font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewExam(exam.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-slate-200 bg-white px-4 text-sm font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditExam(exam.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteExam(exam.id)}
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
