'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import {
  getEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  type Enrollment,
  type EnrollmentStatusType,
  type UpdateEnrollmentDto,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CalendarClock,
  Edit,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const statusOptions: (EnrollmentStatusType | 'all')[] = ['all', 'ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function EnrollmentsPage() {
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

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState<Enrollment | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<{
    status: EnrollmentStatusType;
    billingStartMonth: string;
  }>({
    status: 'ACTIVE',
    billingStartMonth: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) {
        setCourses(response.data || []);
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
      if (courseId && courseId !== 'all') params.courseId = courseId;
      if (branchId && branchId !== 'all') params.branchId = branchId;
      const response = await getBatches(params);
      if (response.success && response.data) {
        setBatches(response.data || []);
      } else {
        setBatches([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load batches:', err);
    }
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
      if (response.success && response.data) {
        setEnrollments(response.data || []);
      } else {
        setEnrollments([]);
        setError(response.message || 'Failed to load enrollments');
      }
    } catch (err: unknown) {
      setEnrollments([]);
      setError(getErrorMessage(err) || 'Failed to load enrollments');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, branchFilter, batchFilter, statusFilter]);

  const fetchEnrollmentDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getEnrollmentById(id);
      if (response.success && response.data) {
        const enrollment = response.data;
        setEnrollmentDetails(enrollment);
        setEditForm({
          status: (enrollment.status as EnrollmentStatusType) || 'ACTIVE',
          billingStartMonth: enrollment.billingStartMonth || '',
        });
        return enrollment;
      }
      throw new Error(response.message || 'Failed to load enrollment details');
    } catch (err: unknown) {
      setEnrollmentDetails(null);
      setDetailsError(getErrorMessage(err));
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewEnrollment = async (id: string) => {
    setViewDialogOpen(true);
    await fetchEnrollmentDetails(id);
  };

  const handleEditEnrollment = async (id: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchEnrollmentDetails(id);
  };

  const handleEditSubmit = async () => {
    if (!enrollmentDetails) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateEnrollmentDto = {
        status: editForm.status,
        billingStartMonth: editForm.billingStartMonth || undefined,
      };
      await updateEnrollment(enrollmentDetails.id, payload);
      setEditDialogOpen(false);
      await loadEnrollments();
      toast({
        title: 'Success',
        description: 'Enrollment updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to update enrollment';
      setEditError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteEnrollment(id);
      await loadEnrollments();
      toast({
        title: 'Success',
        description: 'Enrollment deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete enrollment',
        variant: 'destructive',
      });
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const q = searchQuery.toLowerCase();
    const studentName = enrollment.student?.fullName.toLowerCase() || '';
    const mobile = enrollment.student?.mobile || '';
    const courseName = enrollment.course?.name.toLowerCase() || '';
    const branchName = enrollment.branch?.name.toLowerCase() || '';
    return (
      !q ||
      studentName.includes(q) ||
      mobile.includes(searchQuery) ||
      courseName.includes(q) ||
      branchName.includes(q)
    );
  });

  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter((e) => String(e.status) === 'ACTIVE').length;
  const pausedEnrollments = enrollments.filter((e) => String(e.status) === 'PAUSED').length;
  const cancelledEnrollments = enrollments.filter((e) => String(e.status) === 'CANCELLED').length;

  const isDetailsReady = !!enrollmentDetails && !detailsLoading;

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Enrollment Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View and manage student enrollments across branches, courses, and batches.
            </p>
          </div>
          <Button
            className="mt-1 bg-primary hover:bg-primary/90"
            onClick={() => window.open('/admin/enrollments/change', '_blank')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Batch / Branch Change
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Enrollments</p>
          <p className="mt-2 text-2xl font-semibold">{totalEnrollments}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Active</p>
          <p className="mt-2 text-2xl font-semibold">{activeEnrollments}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Paused</p>
          <p className="mt-2 text-2xl font-semibold">{pausedEnrollments}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Cancelled</p>
          <p className="mt-2 text-2xl font-semibold">{cancelledEnrollments}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student, mobile, course, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EnrollmentStatusType | 'all')}>
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
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-10 w-[200px] border-border bg-background">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-10 w-[200px] border-border bg-background">
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
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="h-10 w-[200px] border-border bg-background">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={loadEnrollments}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
            <h2 className="text-base font-semibold tracking-tight">Enrollments</h2>
            <p className="text-xs text-muted-foreground">
              All enrollments with their course, batch, branch, and status.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Users className="h-4 w-4" />
            <span>{totalEnrollments} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading enrollments...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No enrollments found matching your search.' : 'No enrollments found.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing Start</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id} className="hover:bg-muted/45">
                  <TableCell className="font-medium">{enrollment.student?.fullName || '-'}</TableCell>
                  <TableCell>{enrollment.student?.mobile || '-'}</TableCell>
                  <TableCell>{enrollment.course?.name || '-'}</TableCell>
                  <TableCell>{enrollment.batch?.name || '-'}</TableCell>
                  <TableCell>{enrollment.branch?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        String(enrollment.status) === 'ACTIVE'
                          ? 'default'
                          : String(enrollment.status) === 'PAUSED'
                          ? 'secondary'
                          : String(enrollment.status) === 'COMPLETED'
                          ? 'outline'
                          : 'destructive'
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {enrollment.billingStartMonth || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewEnrollment(enrollment.id)}
                        title="View Enrollment"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditEnrollment(enrollment.id)}
                        title="Edit Enrollment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
                        title="Delete Enrollment"
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

      {/* View Enrollment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Enrollment Details</DialogTitle>
            <DialogDescription>View complete enrollment information.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}
            {isDetailsReady && enrollmentDetails && (
              <div className="space-y-5 text-sm py-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Student</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Name</p>
                      <p className="mt-1 font-medium">
                        {enrollmentDetails.student?.fullName || enrollmentDetails.studentUserId}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Mobile</p>
                      <p className="mt-1 font-medium">
                        {enrollmentDetails.student?.mobile || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Course & Batch</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Course</p>
                      <p className="mt-1 font-medium">{enrollmentDetails.course?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Batch</p>
                      <p className="mt-1 font-medium">{enrollmentDetails.batch?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch</p>
                      <p className="mt-1 font-medium">{enrollmentDetails.branch?.name || '-'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Status & Billing</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="mt-1">
                        <Badge
                          variant={
                            String(enrollmentDetails.status) === 'ACTIVE'
                              ? 'default'
                              : String(enrollmentDetails.status) === 'PAUSED'
                              ? 'secondary'
                              : String(enrollmentDetails.status) === 'COMPLETED'
                              ? 'outline'
                              : 'destructive'
                          }
                        >
                          {enrollmentDetails.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Billing Start Month</p>
                      <p className="mt-1 font-medium">
                        {enrollmentDetails.billingStartMonth || '-'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Course Fee</p>
                      <p className="mt-1 font-medium">
                        {enrollmentDetails.course
                          ? Number(enrollmentDetails.course.fee).toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'BDT',
                              maximumFractionDigits: 2,
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm">
                        {new Date(enrollmentDetails.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Updated At</p>
                      <p className="mt-1 text-sm">
                        {new Date(enrollmentDetails.updatedAt).toLocaleString('en-US', {
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

      {/* Edit Enrollment Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-2xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Enrollment</DialogTitle>
            <DialogDescription>Update enrollment status and billing start month.</DialogDescription>
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
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, status: v as EnrollmentStatusType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="PAUSED">PAUSED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Start Month (YYYY-MM)</label>
                  <Input
                    value={editForm.billingStartMonth}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, billingStartMonth: e.target.value }))
                    }
                    placeholder="e.g. 2026-01"
                  />
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

