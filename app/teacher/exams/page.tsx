'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Clock,
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
import { ExamForm, ExamOverviewPanel } from '@/features/admin/exams';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';

const examStatusOptions: (ExamStatus | 'all')[] = ['all', 'DRAFT', 'PUBLISHED', 'CLOSED'];
const examModeOptions: ExamMode[] = ['ONLINE', 'OFFLINE'];

function getStatusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'CLOSED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'PRACTICE': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'SCHEDULED': return 'bg-violet-50 text-violet-700 border-violet-100';
    case 'MODEL': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'TALENT_HUNT': return 'bg-pink-50 text-pink-700 border-pink-100';
    case 'UNIVERSITY': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function getModeBadgeClass(mode: string) {
  return mode === 'ONLINE' 
    ? 'bg-cyan-50 text-cyan-700 border-cyan-100' 
    : 'bg-orange-50 text-orange-700 border-orange-100';
}

export default function TeacherExamsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<ExamMode | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u?.id ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const loadExams = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const params: any = { teacherUserId: userId };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (modeFilter !== 'all') params.mode = modeFilter;
      if (courseFilter !== 'all') params.courseId = courseFilter;

      const response = await getExams(params);
      if (response.success && response.data) {
        setExams(response.data);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.error(err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter, modeFilter, courseFilter]);

  const loadCourses = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getCourses({ teacherUserId: userId, status: 'ACTIVE', limit: 500 });
      if (res.success && res.data) setCourses(res.data || []);
    } catch (err) { console.error(err); }
  }, [userId]);

  const loadBranches = useCallback(async () => {
    try {
      const res = await getBranches();
      if (res.success && res.data) setBranches(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (userId) {
      loadExams();
      loadCourses();
      loadBranches();
    }
  }, [userId, loadExams, loadCourses, loadBranches]);

  const handleViewExam = async (examId: string) => {
    try {
      const res = await getExamById(examId, { teacherUserId: userId ?? undefined });
      if (res.success && res.data) {
        openModal({
          title: 'Exam Details',
          description: 'Questions, PDFs, offline results, leaderboard.',
          className: 'sm:max-w-5xl w-[min(100vw-2rem,56rem)] max-h-[92vh]',
          content: (
            <div className="overflow-y-auto max-h-[80vh] p-4">
              <ExamOverviewPanel exam={res.data} onRefresh={() => {}} />
            </div>
          ),
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load exam details', variant: 'destructive' });
    }
  };

  const handleEditExam = async (examId: string) => {
    try {
      const res = await getExamById(examId, { teacherUserId: userId ?? undefined });
      if (res.success && res.data) {
        openModal({
          title: 'Update Exam',
          description: 'Refine exam scheduling and access rules.',
          className: 'sm:max-w-6xl w-[min(100vw-2rem,72rem)] max-h-[92vh]',
          content: (
            <ExamForm
              courses={courses}
              branches={branches}
              exam={res.data}
              onSuccess={loadExams}
              actingTeacherUserId={userId}
            />
          ),
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load exam for editing', variant: 'destructive' });
    }
  };

  const handleCreateExam = () => {
        openModal({
          title: 'Create Exam',
          description: 'Online (browser) or offline (hall PDF + OMR / Excel).',
          className: 'sm:max-w-6xl w-[min(100vw-2rem,72rem)] max-h-[92vh]',
          content: <ExamForm courses={courses} branches={branches} onSuccess={loadExams} actingTeacherUserId={userId} />,
        });
  };

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Exam Manager</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl">
          Create and manage exams for your assigned courses. You can set up online tests or generate offline question sets.
        </p>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  placeholder="Search exams..."
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
            className="h-12 rounded-2xl bg-indigo-600 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateExam}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Exam
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading exams...</p>
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
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Exam</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Course</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Type / Mode</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.title}</span>
                          {exam.durationMinutes && (
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {exam.durationMinutes} min
                            </span>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                          {exam.course?.name}
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5 w-fit", getTypeBadgeClass(exam.type))}>
                            {exam.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5 w-fit", getModeBadgeClass(exam.mode))}>
                            {exam.mode}
                          </Badge>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <Badge variant="outline" className={cn("rounded-lg text-[9px] uppercase px-2.5 py-1", getStatusBadgeClass(exam.status))}>
                         {exam.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-4">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewExam(exam.id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditExam(exam.id)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
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
