'use client';

import { useEffect, useState } from 'react';
import { getExams, getExamById, createExam, updateExam, deleteExam } from '@/lib/api/exams';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import type {
  Exam,
  ExamType,
  ExamMode,
  ExamStatus,
  CreateExamDto,
  UpdateExamDto,
} from '@/types/exam';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpenCheck,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const examTypeOptions: ExamType[] = ['PRACTICE', 'SCHEDULED', 'MODEL', 'TALENT_HUNT', 'UNIVERSITY'];
const examModeOptions: ExamMode[] = ['ONLINE', 'OFFLINE'];
const examStatusOptions: (ExamStatus | 'all')[] = ['all', 'DRAFT', 'PUBLISHED', 'CLOSED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function ExamsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<ExamMode | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [examDetails, setExamDetails] = useState<Exam | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<CreateExamDto>({
    courseId: '',
    branchId: '',
    batchId: undefined,
    title: '',
    type: 'PRACTICE',
    mode: 'ONLINE',
    startAt: '',
    endAt: '',
    durationMinutes: undefined,
    allowedAttempts: 1,
    status: 'DRAFT',
    settings: undefined,
  });
  const [createForm, setCreateForm] = useState<CreateExamDto>({
    courseId: '',
    branchId: '',
    batchId: undefined,
    title: '',
    type: 'PRACTICE',
    mode: 'ONLINE',
    startAt: '',
    endAt: '',
    durationMinutes: undefined,
    allowedAttempts: 1,
    status: 'DRAFT',
    settings: undefined,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isValidCourse = (value: unknown): value is Course => {
    if (!value || typeof value !== 'object') return false;
    const item = value as Partial<Course>;
    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.programId === 'string' &&
      typeof item.code === 'string'
    );
  };

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
        setError(response.message || 'Failed to load exams');
        setExams([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await getCourses({ status: 'ACTIVE', limit: 500 });
      if (response.success && response.data) {
        const validCourses = (response.data || [])
          .filter(isValidCourse)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCourses(validCourses);
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

  const loadBatches = async (courseId?: string, branchId?: string) => {
    try {
      const params: any = {};
      if (courseId) params.courseId = courseId;
      if (branchId) params.branchId = branchId;
      const response = await getBatches(params);
      if (response.success && response.data) {
        setBatches(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load batches:', err);
    }
  };

  useEffect(() => {
    loadExams();
    loadCourses();
    loadBranches();
  }, []);

  useEffect(() => {
    loadExams();
  }, [statusFilter, modeFilter, courseFilter, branchFilter]);

  useEffect(() => {
    if (createForm.courseId && createForm.branchId) {
      loadBatches(createForm.courseId, createForm.branchId);
    } else {
      setBatches([]);
    }
  }, [createForm.courseId, createForm.branchId]);

  const fetchExamDetails = async (examId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getExamById(examId);

      if (response.success && response.data) {
        setExamDetails(response.data);
        const exam = response.data;
        setEditForm({
          courseId: exam.courseId,
          branchId: exam.branchId,
          batchId: exam.batchId || undefined,
          title: exam.title,
          type: exam.type,
          mode: exam.mode,
          startAt: exam.startAt ? new Date(exam.startAt).toISOString().slice(0, 16) : '',
          endAt: exam.endAt ? new Date(exam.endAt).toISOString().slice(0, 16) : '',
          durationMinutes: exam.durationMinutes || undefined,
          allowedAttempts: exam.allowedAttempts,
          status: exam.status,
          settings: exam.settings,
        });
        if (exam.courseId && exam.branchId) {
          await loadBatches(exam.courseId, exam.branchId);
        }
        return response.data;
      }

      throw new Error(response.message || 'Failed to load exam details');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setDetailsError(message);
      setExamDetails(null);
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewExam = async (examId: string) => {
    setViewDialogOpen(true);
    await fetchExamDetails(examId);
  };

  const handleEditExam = async (examId: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchExamDetails(examId);
  };

  const handleEditSubmit = async () => {
    if (!examDetails) return;

    if (!editForm.title.trim() || !editForm.courseId || !editForm.branchId) {
      setEditError('Title, course, and branch are required');
      toast({
        title: 'Error',
        description: 'Title, course, and branch are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateExamDto = {
        courseId: editForm.courseId,
        branchId: editForm.branchId,
        batchId: editForm.batchId || undefined,
        title: editForm.title.trim(),
        type: editForm.type,
        mode: editForm.mode,
        startAt: editForm.startAt || undefined,
        endAt: editForm.endAt || undefined,
        durationMinutes: editForm.durationMinutes || undefined,
        allowedAttempts: editForm.allowedAttempts,
        status: editForm.status,
        settings: editForm.settings,
      };

      await updateExam(examDetails.id, payload);
      setEditDialogOpen(false);
      await loadExams();

      toast({
        title: 'Success',
        description: 'Exam updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to update exam';
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
    if (!createForm.title.trim() || !createForm.courseId || !createForm.branchId) {
      setCreateError('Title, course, and branch are required');
      toast({
        title: 'Error',
        description: 'Title, course, and branch are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const payload: CreateExamDto = {
        courseId: createForm.courseId,
        branchId: createForm.branchId,
        batchId: createForm.batchId || undefined,
        title: createForm.title.trim(),
        type: createForm.type,
        mode: createForm.mode,
        startAt: createForm.startAt || undefined,
        endAt: createForm.endAt || undefined,
        durationMinutes: createForm.durationMinutes || undefined,
        allowedAttempts: createForm.allowedAttempts || 1,
        status: createForm.status || 'DRAFT',
        settings: createForm.settings,
      };

      await createExam(payload);
      setCreateDialogOpen(false);
      setCreateForm({
        courseId: '',
        branchId: '',
        batchId: undefined,
        title: '',
        type: 'PRACTICE',
        mode: 'ONLINE',
        startAt: '',
        endAt: '',
        durationMinutes: undefined,
        allowedAttempts: 1,
        status: 'DRAFT',
        settings: undefined,
      });
      await loadExams();

      toast({
        title: 'Success',
        description: 'Exam created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to create exam';
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

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteExam(examId);
      await loadExams();

      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete exam',
        variant: 'destructive',
      });
    }
  };

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDetailsReady = !detailsLoading && examDetails !== null;
  const totalExams = exams.length;
  const draftCount = exams.filter((e) => e.status === 'DRAFT').length;
  const publishedCount = exams.filter((e) => e.status === 'PUBLISHED').length;
  const closedCount = exams.filter((e) => e.status === 'CLOSED').length;
  const totalAttempts = exams.reduce((sum, e) => sum + (e._count?.attempts || 0), 0);

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Exam Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage exams, schedules, and exam attempts for all courses.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Exams</p>
          <p className="mt-2 text-2xl font-semibold">{totalExams}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Published</p>
          <p className="mt-2 text-2xl font-semibold">{publishedCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Draft</p>
          <p className="mt-2 text-2xl font-semibold">{draftCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Attempts</p>
          <p className="mt-2 text-2xl font-semibold">{totalAttempts}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exams by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExamStatus | 'all')}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {examStatusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as ExamMode | 'all')}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {examModeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
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
          <Button variant="outline" className="h-10" onClick={loadExams}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      <section className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Exam Catalog</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all registered exams</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <BookOpenCheck className="h-4 w-4" />
            <span>{totalExams} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading exams...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No exams found matching your search.' : 'No exams found. Create your first exam.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id} className="hover:bg-muted/45">
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.course?.name || '-'}</TableCell>
                  <TableCell>{exam.branch?.name || '-'}</TableCell>
                  <TableCell>{exam.batch?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{exam.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{exam.mode}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        exam.status === 'PUBLISHED'
                          ? 'default'
                          : exam.status === 'DRAFT'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{exam._count?.attempts || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {exam.startAt ? new Date(exam.startAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewExam(exam.id)}
                        title="View Exam"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditExam(exam.id)} title="Edit Exam">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExam(exam.id)}
                        title="Delete Exam"
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

      {/* Create Exam Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Exam</DialogTitle>
            <DialogDescription>Add a new exam to the system.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Exam title"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course *</label>
                  <Select
                    value={createForm.courseId}
                    onValueChange={(v) => {
                      setCreateForm((prev) => ({ ...prev, courseId: v, batchId: undefined }));
                      if (createForm.branchId) {
                        loadBatches(v, createForm.branchId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch *</label>
                  <Select
                    value={createForm.branchId}
                    onValueChange={(v) => {
                      setCreateForm((prev) => ({ ...prev, branchId: v, batchId: undefined }));
                      if (createForm.courseId) {
                        loadBatches(createForm.courseId, v);
                      }
                    }}
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch (Optional)</label>
                <Select
                  value={createForm.batchId || undefined}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, batchId: v }))}
                  disabled={!createForm.courseId || !createForm.branchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!createForm.courseId || !createForm.branchId ? 'Select course and branch first' : 'Select batch'} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No batches available</div>
                    ) : (
                      batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, type: v as ExamType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode *</label>
                  <Select
                    value={createForm.mode}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, mode: v as ExamMode }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examModeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={createForm.startAt}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, startAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={createForm.endAt}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, endAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (Minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    value={createForm.durationMinutes || ''}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="Duration in minutes"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Allowed Attempts</label>
                  <Input
                    type="number"
                    min="1"
                    value={createForm.allowedAttempts}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        allowedAttempts: e.target.value ? Number(e.target.value) : 1,
                      }))
                    }
                    placeholder="Number of attempts"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={createForm.status}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, status: v as ExamStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {examStatusOptions.filter((opt) => opt !== 'all').map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
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
              {createSubmitting ? 'Creating...' : 'Create Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Exam Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Exam Details</DialogTitle>
            <DialogDescription>View complete exam information and statistics.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && examDetails && (
              <div className="space-y-5 text-sm py-6">
                {/* Basic Information */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Title</p>
                      <p className="mt-1 font-medium">{examDetails.title}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Course</p>
                      <p className="mt-1 font-medium">{examDetails.course?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch</p>
                      <p className="mt-1 font-medium">{examDetails.branch?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Batch</p>
                      <p className="mt-1 font-medium">{examDetails.batch?.name || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Exam Configuration */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Exam Configuration</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Type</p>
                      <p className="mt-1">
                        <Badge variant="outline">{examDetails.type}</Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Mode</p>
                      <p className="mt-1">
                        <Badge variant="secondary">{examDetails.mode}</Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="mt-1">
                        <Badge
                          variant={
                            examDetails.status === 'PUBLISHED'
                              ? 'default'
                              : examDetails.status === 'DRAFT'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {examDetails.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Allowed Attempts</p>
                      <p className="mt-1 font-medium">{examDetails.allowedAttempts}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Duration</p>
                      <p className="mt-1 font-medium">
                        {examDetails.durationMinutes ? `${examDetails.durationMinutes} minutes` : '-'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Total Attempts</p>
                      <p className="mt-1 font-medium">{examDetails._count?.attempts || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                {(examDetails.startAt || examDetails.endAt) && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Schedule</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {examDetails.startAt && (
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-xs uppercase text-muted-foreground">Start Date & Time</p>
                          <p className="mt-1 text-sm">
                            {new Date(examDetails.startAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                      {examDetails.endAt && (
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-xs uppercase text-muted-foreground">End Date & Time</p>
                          <p className="mt-1 text-sm">
                            {new Date(examDetails.endAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Exam Sets */}
                {examDetails.sets && examDetails.sets.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Exam Sets</p>
                    <div className="space-y-2">
                      {examDetails.sets.map((set) => (
                        <div key={set.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{set.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {set.questions?.length || 0} questions
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam Attempts */}
                {examDetails.attempts && examDetails.attempts.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Recent Attempts</p>
                    <div className="space-y-2">
                      {examDetails.attempts.slice(0, 5).map((attempt) => (
                        <div key={attempt.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{attempt.student?.fullName || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                Started: {new Date(attempt.startedAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline">{attempt.status}</Badge>
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
                        {new Date(examDetails.createdAt).toLocaleString('en-US', {
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

      {/* Edit Exam Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update exam information and save the changes.</DialogDescription>
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
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Exam title"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course *</label>
                    <Select
                      value={editForm.courseId}
                      onValueChange={(v) => {
                        setEditForm((prev) => ({ ...prev, courseId: v, batchId: undefined }));
                        if (editForm.branchId) {
                          loadBatches(v, editForm.branchId);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Branch *</label>
                    <Select
                      value={editForm.branchId}
                      onValueChange={(v) => {
                        setEditForm((prev) => ({ ...prev, branchId: v, batchId: undefined }));
                        if (editForm.courseId) {
                          loadBatches(editForm.courseId, v);
                        }
                      }}
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch (Optional)</label>
                  <Select
                    value={editForm.batchId || undefined}
                    onValueChange={(v) => setEditForm((prev) => ({ ...prev, batchId: v }))}
                    disabled={!editForm.courseId || !editForm.branchId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!editForm.courseId || !editForm.branchId ? 'Select course and branch first' : 'Select batch'} />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No batches available</div>
                      ) : (
                        batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type *</label>
                    <Select
                      value={editForm.type}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, type: v as ExamType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {examTypeOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode *</label>
                    <Select
                      value={editForm.mode}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, mode: v as ExamMode }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {examModeOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={editForm.startAt}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, startAt: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={editForm.endAt}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, endAt: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (Minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.durationMinutes || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      placeholder="Duration in minutes"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Allowed Attempts</label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.allowedAttempts}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          allowedAttempts: e.target.value ? Number(e.target.value) : 1,
                        }))
                      }
                      placeholder="Number of attempts"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm((prev) => ({ ...prev, status: v as ExamStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examStatusOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
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
