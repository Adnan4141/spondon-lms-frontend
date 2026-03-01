'use client';

import { useEffect, useState } from 'react';
import { getPrograms } from '@/lib/api/programs';
import { getCourseById, getCourses, updateCourse, createCourse } from '@/lib/api/courses';
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
import { BookOpenCheck, CalendarClock, Plus, RefreshCw, Search, Sparkles, Users } from 'lucide-react';

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

  const fetchCourseDetails = async (courseId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getCourseById(courseId);

      if (response.success && response.data) {
        setCourseDetails(response.data as CourseDetails);
        return response.data as CourseDetails;
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
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err) || 'Failed to create course');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!courseDetails) return;

    const parsedFee = Number(editForm.fee);
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setEditError('Fee must be a valid positive number.');
      return;
    }

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
    };

    try {
      setEditSubmitting(true);
      setEditError(null);
      await updateCourse(courseDetails.id, payload);
      setEditDialogOpen(false);
      await loadCourses();
    } catch (err: unknown) {
      setEditError(getErrorMessage(err) || 'Failed to update course');
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
    </div>
  );
}
