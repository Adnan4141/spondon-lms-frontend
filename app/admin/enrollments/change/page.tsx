'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments, changeEnrollmentBatch, changeEnrollmentBranch, bulkChangeBatch, bulkChangeBranch } from '@/lib/api/enrollments';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { Batch } from '@/lib/api/batches';
import type { Enrollment } from '@/lib/api/enrollments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  RefreshCw,
  Search,
  ArrowRightLeft,
  Users,
  Check,
  Square,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function EnrollmentChangePage() {
  const { toast, toasts, removeToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);

  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [changeType, setChangeType] = useState<'batch' | 'branch' | null>(null);
  const [newBatchId, setNewBatchId] = useState<string>('');
  const [newBranchId, setNewBranchId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedBranch) {
      loadBatches(selectedCourse, selectedBranch);
      loadEnrollments();
    } else {
      setBatches([]);
      setEnrollments([]);
    }
  }, [selectedCourse, selectedBranch, selectedBatch]);

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

  const loadBatches = async (courseId: string, branchId: string) => {
    try {
      const response = await getBatches({ courseId, branchId });
      if (response.success && response.data) {
        setBatches(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load batches:', err);
    }
  };

  const loadEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      setError(null);
      const params: any = { courseId: selectedCourse };
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedBatch) params.batchId = selectedBatch;
      const response = await getEnrollments(params);
      if (response.success && response.data) {
        setEnrollments(response.data || []);
      } else {
        setError(response.message || 'Failed to load enrollments');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChangeDialog = (type: 'batch' | 'branch') => {
    if (selectedEnrollments.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one enrollment',
        variant: 'destructive',
      });
      return;
    }
    setChangeType(type);
    setChangeDialogOpen(true);
  };

  const handleChange = async () => {
    if (!changeType || selectedEnrollments.length === 0) return;

    try {
      setSubmitting(true);
      if (selectedEnrollments.length === 1) {
        // Single enrollment change
        const enrollmentId = selectedEnrollments[0];
        if (changeType === 'batch') {
          if (!newBatchId) {
            toast({
              title: 'Error',
              description: 'Please select a new batch',
              variant: 'destructive',
            });
            return;
          }
          await changeEnrollmentBatch(enrollmentId, newBatchId, reason);
        } else {
          if (!newBranchId) {
            toast({
              title: 'Error',
              description: 'Please select a new branch',
              variant: 'destructive',
            });
            return;
          }
          await changeEnrollmentBranch(enrollmentId, newBranchId, reason);
        }
        toast({
          title: 'Success',
          description: `${changeType === 'batch' ? 'Batch' : 'Branch'} changed successfully`,
          variant: 'success',
        });
      } else {
        // Bulk change
        if (changeType === 'batch') {
          if (!newBatchId) {
            toast({
              title: 'Error',
              description: 'Please select a new batch',
              variant: 'destructive',
            });
            return;
          }
          await bulkChangeBatch({
            courseId: selectedCourse,
            branchId: selectedBranch || undefined,
            toBatchId: newBatchId,
            enrollmentIds: selectedEnrollments,
            reason,
          });
        } else {
          if (!newBranchId) {
            toast({
              title: 'Error',
              description: 'Please select a new branch',
              variant: 'destructive',
            });
            return;
          }
          await bulkChangeBranch({
            courseId: selectedCourse,
            toBranchId: newBranchId,
            enrollmentIds: selectedEnrollments,
            reason,
          });
        }
        toast({
          title: 'Success',
          description: `${selectedEnrollments.length} enrollments updated successfully`,
          variant: 'success',
        });
      }
      setChangeDialogOpen(false);
      setSelectedEnrollments([]);
      setReason('');
      await loadEnrollments();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to change enrollment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) =>
    enrollment.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.student?.mobile.includes(searchQuery)
  );

  const toggleEnrollment = (id: string) => {
    if (selectedEnrollments.includes(id)) {
      setSelectedEnrollments(selectedEnrollments.filter((eid) => eid !== id));
    } else {
      setSelectedEnrollments([...selectedEnrollments, id]);
    }
  };

  const toggleAll = () => {
    if (selectedEnrollments.length === filteredEnrollments.length) {
      setSelectedEnrollments([]);
    } else {
      setSelectedEnrollments(filteredEnrollments.map((e) => e.id));
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Enrollment Batch/Branch Change</h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Change batch or branch for student enrollments. Supports single and bulk operations.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-base font-medium">Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium">Branch</label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium">Batch</label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {selectedEnrollments.length > 0 && (
        <section className="glass-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-base font-medium">
              {selectedEnrollments.length} enrollment(s) selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChangeDialog('batch')}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Change Batch
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChangeDialog('branch')}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Change Branch
              </Button>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {selectedCourse && (
        <section className="glass-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Enrollments</h2>
              <p className="text-base text-muted-foreground">
                Select enrollments to change batch or branch
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[200px] border-border bg-background pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={loadEnrollments}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
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
                  <TableHead className="w-12">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAll}
                      title="Select all"
                    >
                      {selectedEnrollments.length === filteredEnrollments.length ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id} className="hover:bg-muted/45">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEnrollment(enrollment.id)}
                        title="Toggle selection"
                      >
                        {selectedEnrollments.includes(enrollment.id) ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {enrollment.student?.fullName || '-'}
                    </TableCell>
                    <TableCell>{enrollment.student?.mobile || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{enrollment.batch?.name || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{enrollment.branch?.name || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          enrollment.status === 'ACTIVE'
                            ? 'default'
                            : enrollment.status === 'PAUSED'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      {/* Change Dialog */}
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent className="sm:max-w-2xl" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>
              Change {changeType === 'batch' ? 'Batch' : 'Branch'} for {selectedEnrollments.length} Enrollment(s)
            </DialogTitle>
            <DialogDescription>
              Select the new {changeType === 'batch' ? 'batch' : 'branch'} and provide a reason (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {changeType === 'batch' ? (
              <div className="space-y-2">
                <label className="text-base font-medium">New Batch *</label>
                <Select value={newBatchId} onValueChange={setNewBatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-base font-medium">New Branch *</label>
                <Select value={newBranchId} onValueChange={setNewBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new branch" />
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
            )}
            <div className="space-y-2">
              <label className="text-base font-medium">Reason (Optional)</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChange} disabled={submitting}>
              {submitting ? 'Changing...' : 'Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
