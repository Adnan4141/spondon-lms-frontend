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
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
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
  
  // Dialog states for adding content
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

        // Parse course outline from JSON
        if (details.outline && typeof details.outline === 'object') {
          const outline = details.outline as any;
          setCourseOutline({
            totalClasses: outline.totalClasses,
            duration: outline.duration || '',
            instructor: outline.instructor || '',
            schedule: outline.schedule || '',
            prerequisites: Array.isArray(outline.prerequisites) ? outline.prerequisites : [],
          });
        }

        // Fetch course contents
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
        fileUrl: undefined, // Will be set by backend if file is uploaded
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
      
      // Reset form
      setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SAMPLE' });
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

    // Build course outline JSON
    const outline: CourseOutline = {
      totalClasses: courseOutline.totalClasses,
      duration: courseOutline.duration?.trim() || undefined,
      instructor: courseOutline.instructor?.trim() || undefined,
      schedule: courseOutline.schedule?.trim() || undefined,
      prerequisites: courseOutline.prerequisites && courseOutline.prerequisites.filter((p) => p.trim()).length > 0
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
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Course Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage structure, visibility, billing, and lifecycle of all courses from one unified workspace.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Visible Rows</p>
          <p className="mt-2 text-2xl font-semibold">{totalVisible}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Active Courses</p>
          <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Enrollments</p>
          <p className="mt-2 text-2xl font-semibold">{totalEnrollments}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Featured</p>
          <p className="mt-2 text-2xl font-semibold">{featuredCount}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses by name, code, or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CourseStatus | 'all')}>
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
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CourseType | 'all')}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Types' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={loadCourses}>
            <RefreshCw className="h-4 w-4" />
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
            <h2 className="text-base font-semibold tracking-tight">Course Catalog</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all registered courses</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <BookOpenCheck className="h-4 w-4" />
            <span>{pagination.total} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No courses found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="hover:bg-muted/45">
                  <TableCell className="font-mono text-sm">{course.code}</TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.program?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.type}</Badge>
                  </TableCell>
                  <TableCell>{course.billingType}</TableCell>
                  <TableCell>৳{Number(course.fee).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={course.status === 'ACTIVE' ? 'default' : course.status === 'DISABLED' ? 'secondary' : 'outline'}>
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {course.featured ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>{course._count?.enrollments || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewCourse(course.id)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditCourse(course.id)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {pagination.pages > 1 && (
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
            <DialogDescription>Add a new course to the system.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program</label>
              <Select
                value={createForm.programId}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, programId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                value={createForm.code}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g., HSC-PHY-01"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Course Name</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Course name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={createForm.type}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, type: value as CourseType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <label className="text-sm font-medium">Billing Type</label>
              <Select
                value={createForm.billingType}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, billingType: value as BillingType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={createForm.status}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as CourseStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <label className="text-sm font-medium">Admission</label>
              <Select
                value={createForm.admissionStatus}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, admissionStatus: value as AdmissionStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {admissionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Fee</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={createForm.fee}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, fee: e.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>

            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.featured}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4"
                />
                Featured
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.websiteVisible}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, websiteVisible: e.target.checked }))}
                  className="h-4 w-4"
                />
                Website Visible
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.settledOptionEnabled}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, settledOptionEnabled: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                Settled Option Enabled
              </label>
            </div>
          </div>

          {createError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {createError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription>View full course information and related activity.</DialogDescription>
          </DialogHeader>

          {detailsLoading && <p className="text-sm text-muted-foreground">Loading details...</p>}
          {!detailsLoading && detailsError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {detailsError}
            </div>
          )}

          {isDetailsReady && courseDetails && (
            <div className="space-y-5 text-sm">
              {/* Basic Information */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Name</p>
                    <p className="mt-1 font-medium">{courseDetails.name}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Code</p>
                    <p className="mt-1 font-medium">{courseDetails.code}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Program</p>
                    <p className="mt-1 font-medium">{courseDetails.program?.name || '-'}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Fee</p>
                    <p className="mt-1 font-medium">৳{Number(courseDetails.fee).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {courseDetails.type}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Billing Type</p>
                    <Badge variant="outline" className="mt-1">
                      {courseDetails.billingType}
                    </Badge>
                  </div>
                  {courseDetails.category && (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Category</p>
                      <Badge variant="outline" className="mt-1">
                        {courseDetails.category}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Information */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Status & Visibility</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <Badge
                        variant={
                          courseDetails.status === 'ACTIVE'
                            ? 'default'
                            : courseDetails.status === 'DISABLED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {courseDetails.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Admission Status</p>
                    <div className="mt-1">
                      <Badge
                        variant={courseDetails.admissionStatus === 'OPEN' ? 'default' : 'destructive'}
                      >
                        {courseDetails.admissionStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Branch Access</p>
                    <Badge variant="outline" className="mt-1">
                      {courseDetails.branchAccessMode || 'ALL_BRANCH'}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Features</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {courseDetails.featured && (
                        <Badge variant="default" className="text-xs">
                          Featured
                        </Badge>
                      )}
                      {courseDetails.websiteVisible && (
                        <Badge variant="outline" className="text-xs">
                          Website Visible
                        </Badge>
                      )}
                      {courseDetails.enrollmentVisible && (
                        <Badge variant="outline" className="text-xs">
                          Enrollment Visible
                        </Badge>
                      )}
                      {courseDetails.settledOptionEnabled && (
                        <Badge variant="outline" className="text-xs">
                          Settled Option
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timestamps</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Created At</p>
                    <p className="mt-1 text-sm">
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
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Last Updated</p>
                    <p className="mt-1 text-sm">
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
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" /> Enrollments
                  </div>
                  <p className="mt-1 text-lg font-semibold">{courseDetails.enrollments?.length || 0}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" /> Batches
                  </div>
                  <p className="mt-1 text-lg font-semibold">{courseDetails.batches?.length || 0}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4" /> Teachers
                  </div>
                  <p className="mt-1 text-lg font-semibold">{courseDetails.teachers?.length || 0}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Description</p>
                <p className="mt-1 text-sm text-muted-foreground">{courseDetails.description || 'No description provided.'}</p>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase text-muted-foreground">Assigned Teachers</p>
                <div className="space-y-2">
                  {courseDetails.teachers?.length ? (
                    courseDetails.teachers.map((item) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        <p className="font-medium">{item.teacher?.fullName || 'Unknown Teacher'}</p>
                        <p className="text-xs text-muted-foreground">{item.teacher?.email || 'No email'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No teachers assigned.</p>
                  )}
                </div>
              </div>

              {/* Course Outline */}
              {courseDetails.outline && (
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Course Outline</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(courseOutline.totalClasses || (courseDetails.outline as any)?.totalClasses) && (
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-xs font-medium text-muted-foreground">Total Classes</p>
                        <p className="mt-1 text-base font-semibold">
                          {courseOutline.totalClasses || (courseDetails.outline as any)?.totalClasses || '-'}
                        </p>
                      </div>
                    )}
                    {(courseOutline.duration || (courseDetails.outline as any)?.duration) && (
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-xs font-medium text-muted-foreground">Duration</p>
                        <p className="mt-1 text-base font-semibold">
                          {courseOutline.duration || (courseDetails.outline as any)?.duration || '-'}
                        </p>
                      </div>
                    )}
                    {(courseOutline.instructor || (courseDetails.outline as any)?.instructor) && (
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-xs font-medium text-muted-foreground">Instructor</p>
                        <p className="mt-1 text-base font-semibold">
                          {courseOutline.instructor || (courseDetails.outline as any)?.instructor || '-'}
                        </p>
                      </div>
                    )}
                    {(courseOutline.schedule || (courseDetails.outline as any)?.schedule) && (
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-xs font-medium text-muted-foreground">Schedule</p>
                        <p className="mt-1 text-base font-semibold">
                          {courseOutline.schedule || (courseDetails.outline as any)?.schedule || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                  {((courseOutline.prerequisites && courseOutline.prerequisites.length > 0) ||
                    ((courseDetails.outline as any)?.prerequisites &&
                      Array.isArray((courseDetails.outline as any).prerequisites) &&
                      (courseDetails.outline as any).prerequisites.length > 0)) && (
                    <div className="mt-3 rounded-md bg-muted/30 p-2">
                      <p className="text-xs font-medium text-muted-foreground">Prerequisites</p>
                      <ul className="mt-2 space-y-1">
                        {(
                          courseOutline.prerequisites ||
                          (courseDetails.outline as any)?.prerequisites ||
                          []
                        ).map((prereq: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {prereq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Syllabus */}
              {contentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading contents...</p>
              ) : (
                <>
                  {courseContents.filter((c) => c.type === 'SYLLABUS').length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
                        Syllabus (Module/Chapter based)
                      </p>
                      <div className="space-y-3">
                        {courseContents
                          .filter((c) => c.type === 'SYLLABUS')
                          .map((content) => {
                            const fileUrl = content.fileUrl?.startsWith('http')
                              ? content.fileUrl
                              : content.fileUrl?.startsWith('/uploads')
                              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${content.fileUrl}`
                              : content.fileUrl;
                            return (
                              <div key={content.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                    <div className="flex-1">
                                      <p className="font-medium">{content.title}</p>
                                      {fileUrl && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            className="h-7 text-xs"
                                          >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            View PDF
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = fileUrl;
                                              link.download = content.title + '.pdf';
                                              link.click();
                                            }}
                                            className="h-7 text-xs"
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

                  {/* Leaflet/Schedule */}
                  {courseContents.filter((c) => c.type === 'LEAFLET').length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Leaflet / Schedule</p>
                      <div className="space-y-3">
                        {courseContents
                          .filter((c) => c.type === 'LEAFLET')
                          .map((content) => {
                            const fileUrl = content.fileUrl?.startsWith('http')
                              ? content.fileUrl
                              : content.fileUrl?.startsWith('/uploads')
                              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${content.fileUrl}`
                              : content.fileUrl;
                            return (
                              <div key={content.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                    <div className="flex-1">
                                      <p className="font-medium">{content.title}</p>
                                      {fileUrl && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            className="h-7 text-xs"
                                          >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            View PDF
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = fileUrl;
                                              link.download = content.title + '.pdf';
                                              link.click();
                                            }}
                                            className="h-7 text-xs"
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

                  {/* Sample/Free Content */}
                  {courseContents.filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type)).length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Sample / Free Content</p>
                      <div className="space-y-3">
                        {courseContents
                          .filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type))
                          .map((content) => {
                            const fileUrl = content.fileUrl?.startsWith('http')
                              ? content.fileUrl
                              : content.fileUrl?.startsWith('/uploads')
                              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${content.fileUrl}`
                              : content.fileUrl;
                            return (
                              <div key={content.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    {content.type === 'VIDEO' ? (
                                      <FileVideo className="h-5 w-5 mt-0.5 text-primary" />
                                    ) : (
                                      <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{content.title}</p>
                                        <Badge variant="outline" className="text-xs">
                                          {content.type}
                                        </Badge>
                                      </div>
                                      {fileUrl && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            className="h-7 text-xs"
                                          >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            {content.type === 'VIDEO' ? 'Watch Video' : 'View Content'}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = fileUrl;
                                              link.download = content.title;
                                              link.click();
                                            }}
                                            className="h-7 text-xs"
                                          >
                                            <Download className="mr-1 h-3 w-3" />
                                            Download
                                          </Button>
                                        </div>
                                      )}
                                      {content.textBody && (
                                        <p className="mt-2 text-sm text-muted-foreground">{content.textBody}</p>
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
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course information and save the changes.</DialogDescription>
          </DialogHeader>

          {detailsLoading && <p className="text-sm text-muted-foreground">Loading form...</p>}
          {!detailsLoading && detailsError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {detailsError}
            </div>
          )}

          {isDetailsReady && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Program</label>
                <Select
                  value={editForm.programId}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, programId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input
                  value={editForm.code}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Course Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, type: value as CourseType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <label className="text-sm font-medium">Billing Type</label>
                <Select
                  value={editForm.billingType}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, billingType: value as BillingType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {billingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value as CourseStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <label className="text-sm font-medium">Admission</label>
                <Select
                  value={editForm.admissionStatus}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, admissionStatus: value as AdmissionStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {admissionOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Fee</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.fee}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fee: e.target.value }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>

              <div className="flex flex-wrap gap-4 sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.featured}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.websiteVisible}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, websiteVisible: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Website Visible
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.settledOptionEnabled}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, settledOptionEnabled: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Settled Option Enabled
                </label>
              </div>

              {/* Course Outline Section */}
              <div className="space-y-3 border-t pt-4 sm:col-span-2">
                <h3 className="text-sm font-semibold">Course Outline</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Classes</label>
                    <Input
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
                    <label className="text-sm font-medium">Duration</label>
                    <Input
                      value={courseOutline.duration}
                      onChange={(e) => setCourseOutline((prev) => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 3 months"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instructor</label>
                    <Input
                      value={courseOutline.instructor}
                      onChange={(e) => setCourseOutline((prev) => ({ ...prev, instructor: e.target.value }))}
                      placeholder="Instructor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule</label>
                    <Input
                      value={courseOutline.schedule}
                      onChange={(e) => setCourseOutline((prev) => ({ ...prev, schedule: e.target.value }))}
                      placeholder="e.g., Mon-Wed-Fri, 6-8 PM"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prerequisites</label>
                  <div className="flex gap-2">
                    <Input
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
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {prereq}
                          <button
                            type="button"
                            onClick={() => {
                              setCourseOutline((prev) => ({
                                ...prev,
                                prerequisites: (prev.prerequisites || []).filter((_, i) => i !== idx),
                              }));
                            }}
                            className="ml-1 rounded-full hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Course Contents Management */}
              <div className="space-y-4 border-t pt-4 sm:col-span-2">
                <h3 className="text-sm font-semibold">Course Contents</h3>

                {/* Syllabus Section */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Syllabus (Module/Chapter based - PDF)</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : courseContents.filter((c) => c.type === 'SYLLABUS').length === 0 ? (
                      <p className="text-xs text-muted-foreground">No syllabus uploaded</p>
                    ) : (
                      courseContents
                        .filter((c) => c.type === 'SYLLABUS')
                        .map((content) => (
                          <div key={content.id} className="flex items-center justify-between rounded border bg-muted/20 p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{content.title}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Leaflet Section */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Leaflet / Schedule (PDF)</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : courseContents.filter((c) => c.type === 'LEAFLET').length === 0 ? (
                      <p className="text-xs text-muted-foreground">No leaflet uploaded</p>
                    ) : (
                      courseContents
                        .filter((c) => c.type === 'LEAFLET')
                        .map((content) => (
                          <div key={content.id} className="flex items-center justify-between rounded border bg-muted/20 p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{content.title}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Sample/Free Content Section */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Sample / Free Content (Video / Notes)</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : courseContents.filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type)).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sample content added</p>
                    ) : (
                      courseContents
                        .filter((c) => ['SAMPLE', 'VIDEO', 'NOTE'].includes(c.type))
                        .map((content) => (
                          <div key={content.id} className="flex items-center justify-between rounded border bg-muted/20 p-2">
                            <div className="flex items-center gap-2">
                              {content.type === 'VIDEO' ? (
                                <FileVideo className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <div>
                                <span className="text-sm font-medium">{content.title}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {content.type}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
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
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {editError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editSubmitting || !isDetailsReady}>
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Syllabus Dialog */}
      <Dialog
        open={syllabusDialogOpen}
        onOpenChange={(open) => {
          setSyllabusDialogOpen(open);
          if (!open) setContentForm({ title: '', fileUrl: '', textBody: '', type: 'SYLLABUS' });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Syllabus</DialogTitle>
            <DialogDescription>Add a new syllabus PDF for this course</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (e.g., "Module 1: Introduction")</label>
              <Input
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Module 1: Introduction"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PDF File</label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setContentFile(file);
                  }
                }}
              />
              {contentFile && (
                <p className="text-xs text-muted-foreground">Selected: {contentFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyllabusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitContent}>Add Syllabus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leaflet Dialog */}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leaflet / Schedule</DialogTitle>
            <DialogDescription>Add a new leaflet or schedule PDF for this course</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Course Schedule"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PDF File</label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setContentFile(file);
                  }
                }}
              />
              {contentFile && (
                <p className="text-xs text-muted-foreground">Selected: {contentFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeafletDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitContent}>Add Leaflet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sample Content Dialog */}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sample / Free Content</DialogTitle>
            <DialogDescription>Add video, notes, or sample content for this course</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select
                value={contentForm.type}
                onValueChange={(value) => setContentForm((prev) => ({ ...prev, type: value as ContentType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="SAMPLE">Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Content title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">File/Video (optional)</label>
              <Input
                type="file"
                accept=".mp4,.mpeg,.mov,.avi,.pdf,.doc,.docx,.txt,.xls,.xlsx,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setContentFile(file);
                  }
                }}
              />
              {contentFile && (
                <p className="text-xs text-muted-foreground">Selected: {contentFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Content (optional)</label>
              <textarea
                value={contentForm.textBody}
                onChange={(e) => setContentForm((prev) => ({ ...prev, textBody: e.target.value }))}
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder="Enter text content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSampleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitContent}>Add Content</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
