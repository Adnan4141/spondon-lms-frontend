'use client';

import { useEffect, useState } from 'react';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getCourseBranches, addCourseBranch, bulkAddCourseBranches, removeCourseBranch } from '@/lib/api/course-branches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { CourseBranch } from '@/lib/api/course-branches';
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
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function CourseBranchesPage() {
  const { toast, toasts, removeToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courseBranches, setCourseBranches] = useState<CourseBranch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseBranches();
    } else {
      setCourseBranches([]);
    }
  }, [selectedCourse]);

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

  const loadCourseBranches = async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseBranches(selectedCourse);
      if (response.success && response.data) {
        setCourseBranches(response.data || []);
      } else {
        setError(response.message || 'Failed to load course branches');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load course branches');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!selectedCourse || selectedBranches.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a course and at least one branch',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (selectedBranches.length === 1) {
        await addCourseBranch(selectedCourse, selectedBranches[0]);
        toast({
          title: 'Success',
          description: 'Branch added to course successfully',
          variant: 'success',
        });
      } else {
        await bulkAddCourseBranches(selectedCourse, selectedBranches);
        toast({
          title: 'Success',
          description: `${selectedBranches.length} branches added to course successfully`,
          variant: 'success',
        });
      }
      setAddDialogOpen(false);
      setBulkAddDialogOpen(false);
      setSelectedBranches([]);
      await loadCourseBranches();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to add branch',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBranch = async (id: string) => {
    if (!confirm('Are you sure you want to remove this branch from the course?')) {
      return;
    }

    try {
      await removeCourseBranch(id);
      toast({
        title: 'Success',
        description: 'Branch removed from course successfully',
        variant: 'success',
      });
      await loadCourseBranches();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to remove branch',
        variant: 'destructive',
      });
    }
  };

  const availableBranches = branches.filter(
    (branch) => !courseBranches.some((cb) => cb.branchId === branch.id)
  );

  const filteredBranches = courseBranches.filter((cb) =>
    cb.branch?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Course Branch Management</h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Manage branch access permissions for courses. Control which branches can access specific courses.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[300px] flex-1">
            <label className="text-base font-medium mb-2 block">Select Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-10 border-border bg-background">
                <SelectValue placeholder="Select a course" />
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
          {selectedCourse && (
            <>
              <Button
                className="mt-6 bg-primary hover:bg-primary/90"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setBulkAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Bulk Add
              </Button>
              <Button variant="outline" className="mt-6" onClick={loadCourseBranches}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </>
          )}
        </div>
      </section>

      {selectedCourse && selectedCourseData && (
        <section className="glass-panel p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{selectedCourseData.name}</h2>
            <p className="text-base text-muted-foreground">
              Branch Access Mode: <Badge variant="outline">{selectedCourseData.branchAccessMode || 'ALL_BRANCH'}</Badge>
            </p>
            <p className="text-base text-muted-foreground mt-1">
              {selectedCourseData.branchAccessMode === 'ALL_BRANCH'
                ? 'This course is accessible from all branches'
                : 'This course is only accessible from the branches listed below'}
            </p>
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
              <h2 className="text-base font-semibold tracking-tight">Course Branches</h2>
              <p className="text-base text-muted-foreground">
                Branches that have access to this course
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[200px] border-border bg-background pl-10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading branches...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery
                ? 'No branches found matching your search.'
                : 'No branches added to this course yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((cb) => (
                  <TableRow key={cb.id} className="hover:bg-muted/45">
                    <TableCell className="font-medium">{cb.branch?.name || '-'}</TableCell>
                    <TableCell>{cb.branch?.code || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cb.branch?.address || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cb.branch?.phone || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBranch(cb.id)}
                        title="Remove Branch"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Add Branch to Course</DialogTitle>
            <DialogDescription>
              Select a branch to add to {selectedCourseData?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-base font-medium">Available Branches</label>
              <Select
                value={selectedBranches[0] || undefined}
                onValueChange={(v) => setSelectedBranches([v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.code && `(${branch.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableBranches.length === 0 && (
                <p className="text-base text-muted-foreground">
                  All branches are already added to this course
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBranch} disabled={submitting || selectedBranches.length === 0}>
              {submitting ? 'Adding...' : 'Add Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Bulk Add Branches</DialogTitle>
            <DialogDescription>
              Select multiple branches to add to {selectedCourseData?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-base font-medium">Available Branches</label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableBranches.length === 0 ? (
                    <p className="text-base text-muted-foreground">
                      All branches are already added to this course
                    </p>
                  ) : (
                    availableBranches.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          if (selectedBranches.includes(branch.id)) {
                            setSelectedBranches(selectedBranches.filter((id) => id !== branch.id));
                          } else {
                            setSelectedBranches([...selectedBranches, branch.id]);
                          }
                        }}
                      >
                        {selectedBranches.includes(branch.id) ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{branch.name}</p>
                          {branch.code && <p className="text-base text-muted-foreground">{branch.code}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedBranches.length > 0 && (
                  <p className="text-base text-muted-foreground">
                    {selectedBranches.length} branch(es) selected
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => {
              setBulkAddDialogOpen(false);
              setSelectedBranches([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddBranch} disabled={submitting || selectedBranches.length === 0}>
              {submitting ? 'Adding...' : `Add ${selectedBranches.length} Branch(es)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
