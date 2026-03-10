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

const statusOptions: (CourseStatus | 'all')[] = ['all', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: (CourseType | 'all')[] = ['all', 'ONLINE', 'OFFLINE', 'HYBRID'];
const billingOptions: BillingType[] = ['ONE_TIME', 'MONTHLY'];
const admissionOptions: AdmissionStatus[] = ['OPEN', 'CLOSED'];

type EditFormState = {
  programId: string;
  name: string;
  code: string;
  type: CourseType;
  billingType: BillingType;
  fee: string;
  description: string;
  status: CourseStatus;
  admissionStatus: AdmissionStatus;
  featured: boolean;
  websiteVisible: boolean;
  settledOptionEnabled: boolean;
};

const defaultEditForm: EditFormState = {
  programId: '',
  name: '',
  code: '',
  type: 'ONLINE',
  billingType: 'ONE_TIME',
  fee: '0',
  description: '',
  status: 'ACTIVE',
  admissionStatus: 'OPEN',
  featured: false,
  websiteVisible: true,
  settledOptionEnabled: false,
};

const shellCard =
  'rounded-[28px] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl';
const softCard = 'rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg backdrop-blur-md';
const inputClass =
  'h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 focus-visible:ring-offset-0';
const textareaClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40';
const sectionLabel = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40';
const glassButton = 'border-white/10 bg-white/5 text-white hover:bg-white/10';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function mapCourseToEditForm(course: CourseDetails): EditFormState {
  return {
    programId: course.programId,
    name: course.name,
    code: course.code,
    type: course.type,
    billingType: course.billingType,
    fee: String(course.fee),
    description: course.description || '',
    status: course.status,
    admissionStatus: course.admissionStatus,
    featured: course.featured,
    websiteVisible: course.websiteVisible,
    settledOptionEnabled: course.settledOptionEnabled,
  };
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20';
  if (status === 'DISABLED') return 'bg-amber-500/15 text-amber-200 border-amber-400/20';
  if (status === 'ARCHIVED') return 'bg-slate-500/15 text-slate-200 border-slate-400/20';
  return 'bg-white/10 text-white border-white/10';
}

function getTypeBadgeClass(type: string) {
  if (type === 'ONLINE') return 'bg-cyan-500/15 text-cyan-200 border-cyan-400/20';
  if (type === 'OFFLINE') return 'bg-violet-500/15 text-violet-200 border-violet-400/20';
  if (type === 'HYBRID') return 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/20';
  return 'bg-white/10 text-white border-white/10';
}

function checkboxClass() {
  return 'h-4 w-4 accent-fuchsia-500';
}

function dialogContentClass(extra = '') {
  return `max-h-[90vh] gap-0 overflow-hidden border border-white/10 bg-slate-950 text-white shadow-2xl ${extra}`;
}

function getFileUrl(fileUrl?: string | null) {
  if (!fileUrl) return undefined;
  if (fileUrl.startsWith('http')) return fileUrl;
  if (fileUrl.startsWith('/uploads')) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${fileUrl}`;
  }
  return fileUrl;
}

export default function CoursesPage() {
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

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(defaultEditForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<EditFormState>(defaultEditForm);
  const [courseContents, setCourseContents] = useState<CourseContent[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [courseOutline, setCourseOutline] = useState<CourseOutline>({
    totalClasses: undefined,
    duration: '',
    instructor: '',
    schedule: '',
    prerequisites: [],
  });
  const [newPrerequisite, setNewPrerequisite] = useState('');

  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [leafletDialogOpen, setLeafletDialogOpen] = useState(false);
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);
  const [contentForm, setContentForm] = useState({
    title: '',
    fileUrl: '',
    textBody: '',
    type: 'SAMPLE' as ContentType,
  });
  const [contentFile, setContentFile] = useState<File | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetCoursesParams = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

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

        if (response.pagination) {
          setPagination(response.pagination);
        }
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
      if (response.success && response.data) {
        setPrograms(response.data);
      }
    } catch {
      setPrograms([]);
    }
  };

  const loadCourseContents = async (courseId: string) => {
    try {
      setContentsLoading(true);
      const response = await getCourseContents(courseId);
      if (response.success && response.data) {
        setCourseContents(response.data);
      }
    } catch (err) {
      console.error('Failed to load course contents:', err);
      setCourseContents([]);
    } finally {
      setContentsLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);

      const response = await getCourseById(courseId);

      if (response.success && response.data) {
        const details = response.data as CourseDetails;
        setCourseDetails(details);

        if (details.outline && typeof details.outline === 'object') {
          const outline = details.outline as any;
          setCourseOutline({
            totalClasses: outline.totalClasses,
            duration: outline.duration || '',
            instructor: outline.instructor || '',
            schedule: outline.schedule || '',
            prerequisites: Array.isArray(outline.prerequisites) ? outline.prerequisites : [],
          });
        } else {
          setCourseOutline({
            totalClasses: undefined,
            duration: '',
            instructor: '',
            schedule: '',
            prerequisites: [],
          });
        }

        await loadCourseContents(courseId);
        return details;
      }

      throw new Error(response.message || 'Failed to load course details');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setDetailsError(message);
      setCourseDetails(null);
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewCourse = async (courseId: string) => {
    setViewDialogOpen(true);
    await fetchCourseDetails(courseId);
  };

  const handleEditCourse = async (courseId: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    setNewPrerequisite('');
    const details = await fetchCourseDetails(courseId);
    if (details) {
      setEditForm(mapCourseToEditForm(details));
    }
  };

  const handleCreateSubmit = async () => {
    const parsedFee = Number(createForm.fee);

    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setCreateError('Fee must be a valid positive number.');
      return;
    }

    if (!createForm.programId || !createForm.name.trim() || !createForm.code.trim()) {
      setCreateError('Program, name, and code are required.');
      return;
    }

    const payload: CreateCourseDto = {
      programId: createForm.programId,
      name: createForm.name.trim(),
      code: createForm.code.trim(),
      type: createForm.type,
      billingType: createForm.billingType,
      fee: parsedFee,
      description: createForm.description.trim() || undefined,
      status: createForm.status,
      admissionStatus: createForm.admissionStatus,
      featured: createForm.featured,
      websiteVisible: createForm.websiteVisible,
      settledOptionEnabled: createForm.settledOptionEnabled,
    };

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await createCourse(payload);
      setCreateDialogOpen(false);
      setCreateForm(defaultEditForm);
      await loadCourses();

      toast({
        title: 'Success',
        description: 'Course created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to create course';
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

  const handleAddContent = async (type: ContentType, title: string, file?: File, textBody?: string) => {
    if (!courseDetails) return;

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload: CreateCourseContentDto = {
        courseId: courseDetails.id,
        type,
        title: title.trim(),
        fileUrl: undefined,
        textBody: textBody?.trim() || undefined,
        isFree: type === 'SAMPLE',
        sortOrder: courseContents.length,
      };

      await createCourseContent(payload, file || undefined);
      await loadCourseContents(courseDetails.id);

      toast({
        title: 'Success',
        description: 'Content added successfully',
        variant: 'success',
      });

      setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SAMPLE' });
      setContentFile(null);
      setSyllabusDialogOpen(false);
      setLeafletDialogOpen(false);
      setSampleDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to add content',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!courseDetails) return;

    try {
      await deleteCourseContent(contentId);
      await loadCourseContents(courseDetails.id);

      toast({
        title: 'Success',
        description: 'Content deleted successfully',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete content',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitContent = () => {
    if (syllabusDialogOpen) {
      handleAddContent('SYLLABUS', contentForm.title, contentFile || undefined);
    } else if (leafletDialogOpen) {
      handleAddContent('LEAFLET', contentForm.title, contentFile || undefined);
    } else if (sampleDialogOpen) {
      handleAddContent(contentForm.type, contentForm.title, contentFile || undefined, contentForm.textBody);
    }
  };

  const handleEditSubmit = async () => {
    if (!courseDetails) return;

    const parsedFee = Number(editForm.fee);
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setEditError('Fee must be a valid positive number.');
      return;
    }

    const outline: CourseOutline = {
      totalClasses: courseOutline.totalClasses,
      duration: courseOutline.duration?.trim() || undefined,
      instructor: courseOutline.instructor?.trim() || undefined,
      schedule: courseOutline.schedule?.trim() || undefined,
      prerequisites:
        courseOutline.prerequisites && courseOutline.prerequisites.filter((p) => p.trim()).length > 0
          ? courseOutline.prerequisites.filter((p) => p.trim())
          : undefined,
    };

    const payload: UpdateCourseDto = {
      programId: editForm.programId,
      name: editForm.name.trim(),
      code: editForm.code.trim(),
      type: editForm.type,
      billingType: editForm.billingType,
      fee: parsedFee,
      description: editForm.description.trim() || undefined,
      status: editForm.status,
      admissionStatus: editForm.admissionStatus,
      featured: editForm.featured,
      websiteVisible: editForm.websiteVisible,
      settledOptionEnabled: editForm.settledOptionEnabled,
      outline: Object.keys(outline).length > 0 ? (outline as any) : undefined,
    };

    try {
      setEditSubmitting(true);
      setEditError(null);
      await updateCourse(courseDetails.id, payload);
      setEditDialogOpen(false);
      await loadCourses();

      toast({
        title: 'Success',
        description: 'Course updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to update course';
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

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadCourses();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter]);

  const isDetailsReady = !!courseDetails && !detailsLoading;
  const totalVisible = courses.length;
  const activeCount = courses.filter((course) => course.status === 'ACTIVE').length;
  const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0);
  const featuredCount = courses.filter((course) => course.featured).length;

  return (
    <div className="space-y-6 text-white">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_30%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              <BookOpenCheck className="h-3.5 w-3.5 text-fuchsia-300" />
              Course workspace
            </div>
            <h1 className="mt-3 bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              Course Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Manage structure, visibility, billing, syllabus, leaflets, sample content, and lifecycle of all
              courses from one unified premium workspace.
            </p>
          </div>

          <Button
            className="h-11 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 text-white shadow-lg shadow-fuchsia-500/20 hover:opacity-95"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Visible Rows', value: totalVisible, color: 'from-sky-500/20 to-cyan-500/10' },
          { label: 'Active Courses', value: activeCount, color: 'from-emerald-500/20 to-teal-500/10' },
          { label: 'Enrollments', value: totalEnrollments, color: 'from-violet-500/20 to-fuchsia-500/10' },
          { label: 'Featured', value: featuredCount, color: 'from-amber-500/20 to-orange-500/10' },
        ].map((item) => (
          <article
            key={item.label}
            className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
            <div className="relative">
              <p className={sectionLabel}>{item.label}</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white">{item.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={`${shellCard} p-4 sm:p-5`}>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search courses by name, code, or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CourseStatus | 'all')}>
            <SelectTrigger className="h-11 w-[190px] rounded-2xl border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-900 text-white">
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CourseType | 'all')}>
            <SelectTrigger className="h-11 w-[190px] rounded-2xl border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-900 text-white">
              {typeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Types' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className={`h-11 rounded-2xl ${glassButton}`} onClick={loadCourses}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">Course Catalog</h2>
            <p className="text-xs text-white/45">Browse and maintain all registered courses</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-white/45 sm:flex">
            <BookOpenCheck className="h-4 w-4" />
            <span>{pagination.total} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-white/50">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-white/50">No courses found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/[0.04] hover:bg-white/[0.04]">
                  <TableHead className="text-white/55">Code</TableHead>
                  <TableHead className="text-white/55">Name</TableHead>
                  <TableHead className="text-white/55">Program</TableHead>
                  <TableHead className="text-white/55">Type</TableHead>
                  <TableHead className="text-white/55">Billing</TableHead>
                  <TableHead className="text-white/55">Fee</TableHead>
                  <TableHead className="text-white/55">Status</TableHead>
                  <TableHead className="text-white/55">Featured</TableHead>
                  <TableHead className="text-white/55">Enrollments</TableHead>
                  <TableHead className="text-white/55">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className="border-white/10 hover:bg-white/[0.04]">
                    <TableCell className="font-mono text-sm text-cyan-200">{course.code}</TableCell>
                    <TableCell className="font-medium text-white">{course.name}</TableCell>
                    <TableCell className="text-white/70">{course.program?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`border ${getTypeBadgeClass(course.type)}`}>{course.type}</Badge>
                    </TableCell>
                    <TableCell className="text-white/70">{course.billingType}</TableCell>
                    <TableCell className="text-white">৳{Number(course.fee).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusBadgeClass(course.status)}`}>{course.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {course.featured ? (
                        <Badge className="border border-fuchsia-400/20 bg-fuchsia-500/15 text-fuchsia-200">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-white/35">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white/80">{course._count?.enrollments || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-xl ${glassButton}`}
                          onClick={() => handleViewCourse(course.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-xl ${glassButton}`}
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

      {pagination.pages > 1 && (
        <div className={`${shellCard} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <div className="text-sm text-white/50">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-xl ${glassButton}`}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-xl ${glassButton}`}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateError(null);
        }}
      >
        <DialogContent className={dialogContentClass('sm:max-w-4xl')} showCloseButton={true}>
          <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-slate-950/95 px-6 pb-4 pt-6 backdrop-blur-xl">
            <DialogTitle className="text-white">Create Course</DialogTitle>
            <DialogDescription className="text-white/50">Add a new course to the system.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6">
            <div className="grid gap-4 py-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Program</label>
                <Select
                  value={createForm.programId}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, programId: value }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Code</label>
                <Input
                  className={inputClass}
                  value={createForm.code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., HSC-PHY-01"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-white/80">Course Name</label>
                <Input
                  className={inputClass}
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Course name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Type</label>
                <Select
                  value={createForm.type}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, type: value as CourseType }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    {typeOptions
                      .filter((item): item is CourseType => item !== 'all')
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Billing Type</label>
                <Select
                  value={createForm.billingType}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, billingType: value as BillingType }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    {billingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Status</label>
                <Select
                  value={createForm.status}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as CourseStatus }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    {statusOptions
                      .filter((item): item is CourseStatus => item !== 'all')
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Admission</label>
                <Select
                  value={createForm.admissionStatus}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, admissionStatus: value as AdmissionStatus }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    {admissionOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-white/80">Fee</label>
                <Input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.fee}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, fee: e.target.value }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-white/80">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={textareaClass}
                />
              </div>

              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={createForm.featured}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className={checkboxClass()}
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={createForm.websiteVisible}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, websiteVisible: e.target.checked }))}
                    className={checkboxClass()}
                  />
                  Website Visible
                </label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={createForm.settledOptionEnabled}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, settledOptionEnabled: e.target.checked }))
                    }
                    className={checkboxClass()}
                  />
                  Settled Option Enabled
                </label>
              </div>
            </div>

            {createError && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {createError}
              </div>
            )}
          </div>

          <DialogFooter className="mt-auto shrink-0 border-t border-white/10 bg-slate-950/95 px-6 pb-6 pt-4 backdrop-blur-xl">
            <Button variant="outline" className={`rounded-xl ${glassButton}`} onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createSubmitting}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:opacity-95"
            >
              {createSubmitting ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className={dialogContentClass('sm:max-w-4xl')} showCloseButton={true}>
          <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-slate-950/95 px-6 pb-4 pt-6 backdrop-blur-xl">
            <DialogTitle className="text-white">Course Details</DialogTitle>
            <DialogDescription className="text-white/50">
              View full course information and related activity.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6">
            {detailsLoading && <p className="py-6 text-sm text-white/50">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="my-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {detailsError}
              </div>
            )}

            {isDetailsReady && courseDetails && (
              <div className="space-y-5 py-6 text-sm">
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Basic Information
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Name</p>
                      <p className="mt-1 font-medium text-white">{courseDetails.name}</p>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Code</p>
                      <p className="mt-1 font-medium text-white">{courseDetails.code}</p>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Program</p>
                      <p className="mt-1 font-medium text-white">{courseDetails.program?.name || '-'}</p>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Fee</p>
                      <p className="mt-1 font-medium text-white">
                        ৳{Number(courseDetails.fee).toLocaleString()}
                      </p>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Type</p>
                      <Badge className={`mt-1 border ${getTypeBadgeClass(courseDetails.type)}`}>
                        {courseDetails.type}
                      </Badge>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Billing Type</p>
                      <Badge className="mt-1 border border-white/10 bg-white/10 text-white">
                        {courseDetails.billingType}
                      </Badge>
                    </div>
                    {courseDetails.category && (
                      <div className={`${softCard} p-3`}>
                        <p className={sectionLabel}>Category</p>
                        <Badge className="mt-1 border border-white/10 bg-white/10 text-white">
                          {courseDetails.category}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Status & Visibility
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Status</p>
                      <div className="mt-1">
                        <Badge className={`border ${getStatusBadgeClass(courseDetails.status)}`}>
                          {courseDetails.status}
                        </Badge>
                      </div>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Admission Status</p>
                      <div className="mt-1">
                        <Badge
                          className={`border ${
                            courseDetails.admissionStatus === 'OPEN'
                              ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200'
                              : 'border-red-400/20 bg-red-500/15 text-red-200'
                          }`}
                        >
                          {courseDetails.admissionStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Branch Access</p>
                      <Badge className="mt-1 border border-white/10 bg-white/10 text-white">
                        {courseDetails.branchAccessMode || 'ALL_BRANCH'}
                      </Badge>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Features</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {courseDetails.featured && (
                          <Badge className="border border-fuchsia-400/20 bg-fuchsia-500/15 text-fuchsia-200">
                            Featured
                          </Badge>
                        )}
                        {courseDetails.websiteVisible && (
                          <Badge className="border border-cyan-400/20 bg-cyan-500/15 text-cyan-200">
                            Website Visible
                          </Badge>
                        )}
                        {courseDetails.enrollmentVisible && (
                          <Badge className="border border-violet-400/20 bg-violet-500/15 text-violet-200">
                            Enrollment Visible
                          </Badge>
                        )}
                        {courseDetails.settledOptionEnabled && (
                          <Badge className="border border-amber-400/20 bg-amber-500/15 text-amber-200">
                            Settled Option
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Timestamps
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Created At</p>
                      <p className="mt-1 text-sm text-white/80">
                        {courseDetails.createdAt
                          ? new Date(courseDetails.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </p>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={sectionLabel}>Last Updated</p>
                      <p className="mt-1 text-sm text-white/80">
                        {courseDetails.updatedAt
                          ? new Date(courseDetails.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={`${softCard} p-3`}>
                    <div className="flex items-center gap-2 text-white/55">
                      <Users className="h-4 w-4" /> Enrollments
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {courseDetails.enrollments?.length || 0}
                    </p>
                  </div>
                  <div className={`${softCard} p-3`}>
                    <div className="flex items-center gap-2 text-white/55">
                      <CalendarClock className="h-4 w-4" /> Batches
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">{courseDetails.batches?.length || 0}</p>
                  </div>
                  <div className={`${softCard} p-3`}>
                    <div className="flex items-center gap-2 text-white/55">
                      <GraduationCap className="h-4 w-4" /> Teachers
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">{courseDetails.teachers?.length || 0}</p>
                  </div>
                </div>

                <div className={`${softCard} p-4`}>
                  <p className={sectionLabel}>Description</p>
                  <p className="mt-2 text-sm text-white/65">
                    {courseDetails.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Assigned Teachers
                  </p>
                  <div className="space-y-2">
                    {courseDetails.teachers?.length ? (
                      courseDetails.teachers.map((item) => (
                        <div key={item.id} className={`${softCard} p-3`}>
                          <p className="font-medium text-white">{item.teacher?.fullName || 'Unknown Teacher'}</p>
                          <p className="text-xs text-white/50">{item.teacher?.email || 'No email'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/50">No teachers assigned.</p>
                    )}
                  </div>
                </div>

                {courseDetails.outline && (
                  <div className={`${softCard} p-4`}>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
                      Course Outline
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(courseOutline.totalClasses || (courseDetails.outline as any)?.totalClasses) && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs font-medium text-white/45">Total Classes</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {courseOutline.totalClasses || (courseDetails.outline as any)?.totalClasses || '-'}
                          </p>
                        </div>
                      )}
                      {(courseOutline.duration || (courseDetails.outline as any)?.duration) && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs font-medium text-white/45">Duration</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {courseOutline.duration || (courseDetails.outline as any)?.duration || '-'}
                          </p>
                        </div>
                      )}
                      {(courseOutline.instructor || (courseDetails.outline as any)?.instructor) && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs font-medium text-white/45">Instructor</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {courseOutline.instructor || (courseDetails.outline as any)?.instructor || '-'}
                          </p>
                        </div>
                      )}
                      {(courseOutline.schedule || (courseDetails.outline as any)?.schedule) && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs font-medium text-white/45">Schedule</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {courseOutline.schedule || (courseDetails.outline as any)?.schedule || '-'}
                          </p>
                        </div>
                      )}
                    </div>

                    {((courseOutline.prerequisites && courseOutline.prerequisites.length > 0) ||
                      ((courseDetails.outline as any)?.prerequisites &&
                        Array.isArray((courseDetails.outline as any).prerequisites) &&
                        (courseDetails.outline as any).prerequisites.length > 0)) && (
                      <div className="mt-3 rounded-xl bg-white/5 p-3">
                        <p className="text-xs font-medium text-white/45">Prerequisites</p>
                        <ul className="mt-2 space-y-1">
                          {(
                            courseOutline.prerequisites ||
                            (courseDetails.outline as any)?.prerequisites ||
                            []
                          ).map((prereq: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-white/80">
                              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                              {prereq}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {contentsLoading ? (
                  <p className="text-sm text-white/50">Loading contents...</p>
                ) : (
                  <>
                    {courseContents.filter((c) => c.type === 'SYLLABUS').length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
                          Syllabus (Module/Chapter based)
                        </p>
                        <div className="space-y-3">
                          {courseContents
                            .filter((c) => c.type === 'SYLLABUS')
                            .map((content) => {
                              const fileUrl = getFileUrl(content.fileUrl);
                              return (
                                <div key={content.id} className={`${softCard} p-4`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <FileText className="mt-0.5 h-5 w-5 text-cyan-300" />
                                      <div className="flex-1">
                                        <p className="font-medium text-white">{content.title}</p>
                                        {fileUrl && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-8 rounded-xl ${glassButton}`}
                                              onClick={() => window.open(fileUrl, '_blank')}
                                            >
                                              <ExternalLink className="mr-1 h-3 w-3" />
                                              View PDF
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-8 rounded-xl ${glassButton}`}
                                              onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = fileUrl;
                                                link.download = `${content.title}.pdf`;
                                                link.click();
                                              }}
                                            >
                                              <Download className="mr-1 h-3 w-3" />
                                              Download
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {courseContents.filter((c) => c.type === 'LEAFLET').length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
                          Leaflet / Schedule
                        </p>
                        <div className="space-y-3">
                          {courseContents
                            .filter((c) => c.type === 'LEAFLET')
                            .map((content) => {
                              const fileUrl = getFileUrl(content.fileUrl);
                              return (
                                <div key={content.id} className={`${softCard} p-4`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <FileText className="mt-0.5 h-5 w-5 text-violet-300" />
                                      <div className="flex-1">
                                        <p className="font-medium text-white">{content.title}</p>
                                        {fileUrl && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-8 rounded-xl ${glassButton}`}
                                              onClick={() => window.open(fileUrl, '_blank')}
                                            >
                                              <ExternalLink className="mr-1 h-3 w-3" />
                                              View PDF
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-8 rounded-xl ${glassButton}`}
                                              onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = fileUrl;
                                                link.download = `${content.title}.pdf`;
                                                link.click();
                                              }}
                                            >
                                              <Download className="mr-1 h-3 w-3" />
                                              Download
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {courseContents.filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type)).length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
                          Sample / Free Content
                        </p>
                        <div className="space-y-3">
                          {courseContents
                            .filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type))
                            .map((content) => {
                              const fileUrl = getFileUrl(content.fileUrl);
                              return (
                                <div key={content.id} className={`${softCard} p-4`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      {content.type === 'VIDEO' ? (
                                        <FileVideo className="mt-0.5 h-5 w-5 text-fuchsia-300" />
                                      ) : (
                                        <FileText className="mt-0.5 h-5 w-5 text-cyan-300" />
                                      )}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-white">{content.title}</p>
                                          <Badge className="border border-white/10 bg-white/10 text-white/80">
                                            {content.type}
                                          </Badge>
                                        </div>

                                        {fileUrl && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-8 rounded-xl ${glassButton}`}
                                              onClick={() => window.open(fileUrl, '_blank')}
                                            >
                                              <ExternalLink className="mr-1 h-3 w-3" />
                                              {content.type === 'VIDEO' ? 'Watch Video' : 'View Content'}
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-8 rounded-xl ${glassButton}`}
                                              onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = fileUrl;
                                                link.download = content.title;
                                                link.click();
                                              }}
                                            >
                                              <Download className="mr-1 h-3 w-3" />
                                              Download
                                            </Button>
                                          </div>
                                        )}

                                        {content.textBody && (
                                          <p className="mt-2 text-sm text-white/60">{content.textBody}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className={dialogContentClass('sm:max-w-4xl')} showCloseButton={true}>
          <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-slate-950/95 px-6 pb-4 pt-6 backdrop-blur-xl">
            <DialogTitle className="text-white">Edit Course</DialogTitle>
            <DialogDescription className="text-white/50">
              Update course information and save the changes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6">
            {detailsLoading && <p className="py-6 text-sm text-white/50">Loading form...</p>}
            {!detailsLoading && detailsError && (
              <div className="my-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {detailsError}
              </div>
            )}

            {isDetailsReady && (
              <div className="grid gap-4 py-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Program</label>
                  <Select
                    value={editForm.programId}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, programId: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-white">
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Code</label>
                  <Input
                    className={inputClass}
                    value={editForm.code}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-white/80">Course Name</label>
                  <Input
                    className={inputClass}
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Type</label>
                  <Select
                    value={editForm.type}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, type: value as CourseType }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-white">
                      {typeOptions
                        .filter((item): item is CourseType => item !== 'all')
                        .map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Billing Type</label>
                  <Select
                    value={editForm.billingType}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, billingType: value as BillingType }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-white">
                      {billingOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Status</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value as CourseStatus }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-white">
                      {statusOptions
                        .filter((item): item is CourseStatus => item !== 'all')
                        .map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Admission</label>
                  <Select
                    value={editForm.admissionStatus}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, admissionStatus: value as AdmissionStatus }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-white">
                      {admissionOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-white/80">Fee</label>
                  <Input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.fee}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fee: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-white/80">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className={textareaClass}
                  />
                </div>

                <div className="flex flex-wrap gap-3 sm:col-span-2">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={editForm.featured}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, featured: e.target.checked }))}
                      className={checkboxClass()}
                    />
                    Featured
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={editForm.websiteVisible}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, websiteVisible: e.target.checked }))}
                      className={checkboxClass()}
                    />
                    Website Visible
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={editForm.settledOptionEnabled}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, settledOptionEnabled: e.target.checked }))
                      }
                      className={checkboxClass()}
                    />
                    Settled Option Enabled
                  </label>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4 sm:col-span-2">
                  <h3 className="text-sm font-semibold text-white">Course Outline</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Total Classes</label>
                      <Input
                        className={inputClass}
                        type="number"
                        min="0"
                        value={courseOutline.totalClasses || ''}
                        onChange={(e) =>
                          setCourseOutline((prev) => ({
                            ...prev,
                            totalClasses: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Duration</label>
                      <Input
                        className={inputClass}
                        value={courseOutline.duration}
                        onChange={(e) => setCourseOutline((prev) => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 3 months"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Instructor</label>
                      <Input
                        className={inputClass}
                        value={courseOutline.instructor}
                        onChange={(e) => setCourseOutline((prev) => ({ ...prev, instructor: e.target.value }))}
                        placeholder="Instructor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Schedule</label>
                      <Input
                        className={inputClass}
                        value={courseOutline.schedule}
                        onChange={(e) => setCourseOutline((prev) => ({ ...prev, schedule: e.target.value }))}
                        placeholder="e.g., Mon-Wed-Fri, 6-8 PM"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Prerequisites</label>
                    <div className="flex gap-2">
                      <Input
                        className={inputClass}
                        value={newPrerequisite}
                        onChange={(e) => setNewPrerequisite(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPrerequisite.trim()) {
                            e.preventDefault();
                            setCourseOutline((prev) => ({
                              ...prev,
                              prerequisites: [...(prev.prerequisites || []), newPrerequisite.trim()],
                            }));
                            setNewPrerequisite('');
                          }
                        }}
                        placeholder="Add prerequisite and press Enter"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`rounded-xl ${glassButton}`}
                        onClick={() => {
                          if (newPrerequisite.trim()) {
                            setCourseOutline((prev) => ({
                              ...prev,
                              prerequisites: [...(prev.prerequisites || []), newPrerequisite.trim()],
                            }));
                            setNewPrerequisite('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {courseOutline.prerequisites && courseOutline.prerequisites.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {courseOutline.prerequisites.map((prereq, idx) => (
                          <Badge
                            key={idx}
                            className="gap-1 border border-white/10 bg-white/10 text-white hover:bg-white/15"
                          >
                            {prereq}
                            <button
                              type="button"
                              onClick={() => {
                                setCourseOutline((prev) => ({
                                  ...prev,
                                  prerequisites: (prev.prerequisites || []).filter((_, i) => i !== idx),
                                }));
                              }}
                              className="ml-1 rounded-full hover:bg-red-500/20"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-4 sm:col-span-2">
                  <h3 className="text-sm font-semibold text-white">Course Contents</h3>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/80">
                        Syllabus (Module/Chapter based - PDF)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`rounded-xl ${glassButton}`}
                        onClick={() => {
                          setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SYLLABUS' });
                          setContentFile(null);
                          setSyllabusDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {contentsLoading ? (
                        <p className="text-xs text-white/45">Loading...</p>
                      ) : courseContents.filter((c) => c.type === 'SYLLABUS').length === 0 ? (
                        <p className="text-xs text-white/45">No syllabus uploaded</p>
                      ) : (
                        courseContents
                          .filter((c) => c.type === 'SYLLABUS')
                          .map((content) => (
                            <div
                              key={content.id}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-cyan-300" />
                                <span className="text-sm text-white">{content.title}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-red-200 hover:bg-red-500/10 hover:text-red-100"
                                onClick={() => handleDeleteContent(content.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/80">Leaflet / Schedule (PDF)</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`rounded-xl ${glassButton}`}
                        onClick={() => {
                          setContentForm({ title: '', fileUrl: '', textBody: '', type: 'LEAFLET' });
                          setContentFile(null);
                          setLeafletDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {contentsLoading ? (
                        <p className="text-xs text-white/45">Loading...</p>
                      ) : courseContents.filter((c) => c.type === 'LEAFLET').length === 0 ? (
                        <p className="text-xs text-white/45">No leaflet uploaded</p>
                      ) : (
                        courseContents
                          .filter((c) => c.type === 'LEAFLET')
                          .map((content) => (
                            <div
                              key={content.id}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-violet-300" />
                                <span className="text-sm text-white">{content.title}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-red-200 hover:bg-red-500/10 hover:text-red-100"
                                onClick={() => handleDeleteContent(content.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/80">
                        Sample / Free Content (Video / Notes)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`rounded-xl ${glassButton}`}
                        onClick={() => {
                          setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SAMPLE' });
                          setContentFile(null);
                          setSampleDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {contentsLoading ? (
                        <p className="text-xs text-white/45">Loading...</p>
                      ) : courseContents.filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type)).length === 0 ? (
                        <p className="text-xs text-white/45">No sample content added</p>
                      ) : (
                        courseContents
                          .filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type))
                          .map((content) => (
                            <div
                              key={content.id}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                            >
                              <div className="flex items-center gap-2">
                                {content.type === 'VIDEO' ? (
                                  <FileVideo className="h-4 w-4 text-fuchsia-300" />
                                ) : (
                                  <FileText className="h-4 w-4 text-cyan-300" />
                                )}
                                <div>
                                  <span className="text-sm font-medium text-white">{content.title}</span>
                                  <Badge className="ml-2 border border-white/10 bg-white/10 text-xs text-white/80">
                                    {content.type}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-red-200 hover:bg-red-500/10 hover:text-red-100"
                                onClick={() => handleDeleteContent(content.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editError && (
              <div className="my-6 mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {editError}
              </div>
            )}
          </div>

          <DialogFooter className="mt-auto shrink-0 border-t border-white/10 bg-slate-950/95 px-6 pb-6 pt-4 backdrop-blur-xl">
            <Button variant="outline" className={`rounded-xl ${glassButton}`} onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSubmitting || !isDetailsReady}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:opacity-95"
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={syllabusDialogOpen}
        onOpenChange={(open) => {
          setSyllabusDialogOpen(open);
          if (!open) {
            setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SYLLABUS' });
            setContentFile(null);
          }
        }}
      >
        <DialogContent className={dialogContentClass('sm:max-w-xl')}>
          <DialogHeader className="border-b border-white/10 px-6 pb-4 pt-6">
            <DialogTitle className="text-white">Add Syllabus</DialogTitle>
            <DialogDescription className="text-white/50">
              Add a new syllabus PDF for this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Title (e.g., "Module 1: Introduction")</label>
              <Input
                className={inputClass}
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Module 1: Introduction"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">PDF File</label>
              <Input
                className={inputClass}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setContentFile(file);
                }}
              />
              {contentFile && <p className="text-xs text-white/45">Selected: {contentFile.name}</p>}
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 px-6 pb-6 pt-4">
            <Button variant="outline" className={`rounded-xl ${glassButton}`} onClick={() => setSyllabusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitContent}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:opacity-95"
            >
              Add Syllabus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leafletDialogOpen}
        onOpenChange={(open) => {
          setLeafletDialogOpen(open);
          if (!open) {
            setContentForm({ title: '', fileUrl: '', textBody: '', type: 'LEAFLET' });
            setContentFile(null);
          }
        }}
      >
        <DialogContent className={dialogContentClass('sm:max-w-xl')} showCloseButton={true}>
          <DialogHeader className="border-b border-white/10 px-6 pb-4 pt-6">
            <DialogTitle className="text-white">Add Leaflet / Schedule</DialogTitle>
            <DialogDescription className="text-white/50">
              Add a new leaflet or schedule PDF for this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Title</label>
              <Input
                className={inputClass}
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Course Schedule"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">PDF File</label>
              <Input
                className={inputClass}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setContentFile(file);
                }}
              />
              {contentFile && <p className="text-xs text-white/45">Selected: {contentFile.name}</p>}
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 px-6 pb-6 pt-4">
            <Button variant="outline" className={`rounded-xl ${glassButton}`} onClick={() => setLeafletDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitContent}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:opacity-95"
            >
              Add Leaflet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sampleDialogOpen}
        onOpenChange={(open) => {
          setSampleDialogOpen(open);
          if (!open) {
            setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SAMPLE' });
            setContentFile(null);
          }
        }}
      >
        <DialogContent className={dialogContentClass('sm:max-w-xl')} showCloseButton={true}>
          <DialogHeader className="border-b border-white/10 px-6 pb-4 pt-6">
            <DialogTitle className="text-white">Add Sample / Free Content</DialogTitle>
            <DialogDescription className="text-white/50">
              Add video, notes, or sample content for this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Content Type</label>
              <Select
                value={contentForm.type}
                onValueChange={(value) => setContentForm((prev) => ({ ...prev, type: value as ContentType }))}
              >
                <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-white">
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="SAMPLE">Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Title</label>
              <Input
                className={inputClass}
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Content title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">File/Video (optional)</label>
              <Input
                className={inputClass}
                type="file"
                accept=".mp4,.mpeg,.mov,.avi,.pdf,.doc,.docx,.txt,.xls,.xlsx,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setContentFile(file);
                }}
              />
              {contentFile && <p className="text-xs text-white/45">Selected: {contentFile.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Text Content (optional)</label>
              <textarea
                value={contentForm.textBody}
                onChange={(e) => setContentForm((prev) => ({ ...prev, textBody: e.target.value }))}
                rows={4}
                className={textareaClass}
                placeholder="Enter text content..."
              />
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 px-6 pb-6 pt-4">
            <Button variant="outline" className={`rounded-xl ${glassButton}`} onClick={() => setSampleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitContent}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:opacity-95"
            >
              Add Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}