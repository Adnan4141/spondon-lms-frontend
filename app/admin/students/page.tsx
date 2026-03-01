'use client';

import { useEffect, useState } from 'react';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } from '@/lib/api/students';
import { apiRequest } from '@/lib/api';
import type { Student, CreateStudentDto, UpdateStudentDto, UserStatus, Branch, Institute, ApiResponse } from '@/types/student';
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
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const statusOptions: (UserStatus | 'all')[] = ['all', 'ACTIVE', 'BLOCKED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function StudentsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<CreateStudentDto>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    branchId: '',
    status: 'ACTIVE',
  });
  const [createForm, setCreateForm] = useState<CreateStudentDto>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    branchId: '',
    status: 'ACTIVE',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { role: 'STUDENT' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;

      const response = await getStudents(params);
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        setError(response.message || 'Failed to load students');
        setStudents([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await apiRequest<ApiResponse<Branch[]>>('/branches');
      if (response.success && response.data) {
        setBranches(response.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadInstitutes = async () => {
    try {
      const response = await apiRequest<ApiResponse<Institute[]>>('/institutes');
      if (response.success && response.data) {
        setInstitutes(response.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load institutes:', err);
    }
  };

  useEffect(() => {
    loadStudents();
    loadBranches();
    loadInstitutes();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [statusFilter, branchFilter]);

  const fetchStudentDetails = async (studentId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getStudentById(studentId);

      if (response.success && response.data) {
        setStudentDetails(response.data);
        const student = response.data;
        setEditForm({
          fullName: student.fullName,
          email: student.email || '',
          mobile: student.mobile,
          password: '',
          branchId: student.branchId || '',
          status: student.status,
          fatherName: student.studentProfile?.fatherName || '',
          motherName: student.studentProfile?.motherName || '',
          dob: student.studentProfile?.dob || '',
          bloodGroup: student.studentProfile?.bloodGroup || '',
          gender: student.studentProfile?.gender || '',
          primaryMobile: student.studentProfile?.primaryMobile || '',
          secondaryMobile: student.studentProfile?.secondaryMobile || '',
          address: student.studentProfile?.address || '',
          instituteId: student.studentProfile?.instituteId || '',
          registrationNumber: student.studentProfile?.registrationNumber || '',
        });
        return response.data;
      }

      throw new Error(response.message || 'Failed to load student details');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setDetailsError(message);
      setStudentDetails(null);
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewStudent = async (studentId: string) => {
    setViewDialogOpen(true);
    await fetchStudentDetails(studentId);
  };

  const handleEditStudent = async (studentId: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchStudentDetails(studentId);
  };

  const handleEditSubmit = async () => {
    if (!studentDetails) return;

    if (!editForm.fullName.trim() || !editForm.mobile.trim()) {
      setEditError('Full name and mobile are required');
      toast({
        title: 'Error',
        description: 'Full name and mobile are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateStudentDto = {
        fullName: editForm.fullName.trim(),
        email: editForm.email?.trim() || undefined,
        mobile: editForm.mobile.trim(),
        password: editForm.password || undefined,
        branchId: editForm.branchId || undefined,
        status: editForm.status,
        fatherName: editForm.fatherName || undefined,
        motherName: editForm.motherName || undefined,
        dob: editForm.dob || undefined,
        bloodGroup: editForm.bloodGroup || undefined,
        gender: editForm.gender || undefined,
        primaryMobile: editForm.primaryMobile || undefined,
        secondaryMobile: editForm.secondaryMobile || undefined,
        address: editForm.address || undefined,
        instituteId: editForm.instituteId || undefined,
        registrationNumber: editForm.registrationNumber || undefined,
      };

      await updateStudent(studentDetails.id, payload);
      setEditDialogOpen(false);
      await loadStudents();

      toast({
        title: 'Success',
        description: 'Student updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to update student';
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
    if (!createForm.fullName.trim() || !createForm.mobile.trim() || !createForm.password.trim()) {
      setCreateError('Full name, mobile, and password are required');
      toast({
        title: 'Error',
        description: 'Full name, mobile, and password are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const payload: CreateStudentDto = {
        fullName: createForm.fullName.trim(),
        email: createForm.email?.trim() || undefined,
        mobile: createForm.mobile.trim(),
        password: createForm.password,
        branchId: createForm.branchId || undefined,
        status: createForm.status,
        fatherName: createForm.fatherName || undefined,
        motherName: createForm.motherName || undefined,
        dob: createForm.dob || undefined,
        bloodGroup: createForm.bloodGroup || undefined,
        gender: createForm.gender || undefined,
        primaryMobile: createForm.primaryMobile || undefined,
        secondaryMobile: createForm.secondaryMobile || undefined,
        address: createForm.address || undefined,
        instituteId: createForm.instituteId || undefined,
        registrationNumber: createForm.registrationNumber || undefined,
      };

      await createStudent(payload);
      setCreateDialogOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        branchId: '',
        status: 'ACTIVE',
      });
      await loadStudents();

      toast({
        title: 'Success',
        description: 'Student created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to create student';
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

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteStudent(studentId);
      await loadStudents();

      toast({
        title: 'Success',
        description: 'Student deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete student',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.mobile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDetailsReady = !detailsLoading && studentDetails !== null;
  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const blockedCount = students.filter((s) => s.status === 'BLOCKED').length;
  const totalEnrollments = students.reduce((sum, s) => sum + (s._count?.enrollments || 0), 0);

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Student Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage student accounts, profiles, and enrollment information.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Student
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Students</p>
          <p className="mt-2 text-2xl font-semibold">{totalStudents}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Active Students</p>
          <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Blocked Students</p>
          <p className="mt-2 text-2xl font-semibold">{blockedCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Enrollments</p>
          <p className="mt-2 text-2xl font-semibold">{totalEnrollments}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'all')}>
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
          <Button variant="outline" className="h-10" onClick={loadStudents}>
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
            <h2 className="text-base font-semibold tracking-tight">Student Directory</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all registered students</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <BookOpenCheck className="h-4 w-4" />
            <span>{totalStudents} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No students found matching your search.' : 'No students found. Create your first student.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/45">
                  <TableCell className="font-medium">{student.fullName}</TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{student.mobile}</TableCell>
                  <TableCell>{student.branch?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student._count?.enrollments || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewStudent(student.id)}
                        title="View Student"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStudent(student.id)}
                        title="Edit Student"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStudent(student.id)}
                        title="Delete Student"
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

      {/* View Student Dialog - Continuing in next part due to length */}
      {/* Create Student Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Student</DialogTitle>
            <DialogDescription>Add a new student to the system.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Student full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile *</label>
                  <Input
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Mobile number"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <Select
                    value={createForm.branchId || undefined}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, branchId: v || '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch (optional)" />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={createForm.status}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, status: v as UserStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Student Profile (Optional)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Father Name</label>
                    <Input
                      value={createForm.fatherName}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, fatherName: e.target.value }))}
                      placeholder="Father's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mother Name</label>
                    <Input
                      value={createForm.motherName}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, motherName: e.target.value }))}
                      placeholder="Mother's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input
                      type="date"
                      value={createForm.dob}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, dob: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <Input
                      value={createForm.gender}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, gender: e.target.value }))}
                      placeholder="Gender"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Group</label>
                    <Input
                      value={createForm.bloodGroup}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                      placeholder="Blood group"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Mobile</label>
                    <Input
                      value={createForm.primaryMobile}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, primaryMobile: e.target.value }))}
                      placeholder="Primary mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secondary Mobile</label>
                    <Input
                      value={createForm.secondaryMobile}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, secondaryMobile: e.target.value }))}
                      placeholder="Secondary mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Institute</label>
                    <Select
                      value={createForm.instituteId}
                      onValueChange={(v) => setCreateForm((prev) => ({ ...prev, instituteId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select institute" />
                      </SelectTrigger>
                      <SelectContent>
                        {institutes.map((institute) => (
                          <SelectItem key={institute.id} value={institute.id}>
                            {institute.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <textarea
                      value={createForm.address}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      placeholder="Address"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Registration Number</label>
                    <Input
                      value={createForm.registrationNumber}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="Registration number"
                    />
                  </div>
                </div>
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
              {createSubmitting ? 'Creating...' : 'Create Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>View complete student information and enrollment history.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && studentDetails && (
              <div className="space-y-5 text-sm py-6">
                {/* Basic Information */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Full Name</p>
                      <p className="mt-1 font-medium">{studentDetails.fullName}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Email</p>
                      <p className="mt-1 font-medium">{studentDetails.email || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Mobile</p>
                      <p className="mt-1 font-medium">{studentDetails.mobile}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="mt-1">
                        <Badge variant={studentDetails.status === 'ACTIVE' ? 'default' : 'destructive'}>
                          {studentDetails.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch</p>
                      <p className="mt-1 font-medium">{studentDetails.branch?.name || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Enrollments</p>
                      <p className="mt-1 font-medium">{studentDetails._count?.enrollments || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Student Profile */}
                {studentDetails.studentProfile && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Student Profile</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Father Name</p>
                        <p className="mt-1 font-medium">{studentDetails.studentProfile.fatherName || '-'}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Mother Name</p>
                        <p className="mt-1 font-medium">{studentDetails.studentProfile.motherName || '-'}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Date of Birth</p>
                        <p className="mt-1 font-medium">
                          {studentDetails.studentProfile.dob
                            ? new Date(studentDetails.studentProfile.dob).toLocaleDateString()
                            : '-'}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Gender</p>
                        <p className="mt-1 font-medium">{studentDetails.studentProfile.gender || '-'}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Blood Group</p>
                        <p className="mt-1 font-medium">{studentDetails.studentProfile.bloodGroup || '-'}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Institute</p>
                        <p className="mt-1 font-medium">{studentDetails.studentProfile.institute?.name || '-'}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3 sm:col-span-2">
                        <p className="text-xs uppercase text-muted-foreground">Address</p>
                        <p className="mt-1 font-medium">{studentDetails.studentProfile.address || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enrollments */}
                {studentDetails.enrollments && studentDetails.enrollments.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Enrollments</p>
                    <div className="space-y-2">
                      {studentDetails.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{enrollment.course?.name || '-'}</p>
                              <p className="text-xs text-muted-foreground">
                                {enrollment.batch?.name ? `Batch: ${enrollment.batch.name}` : 'No batch'}
                              </p>
                            </div>
                            <Badge variant="outline">{enrollment.status}</Badge>
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
                        {new Date(studentDetails.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Last Updated</p>
                      <p className="mt-1 text-sm">
                        {new Date(studentDetails.updatedAt).toLocaleString('en-US', {
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

      {/* Edit Student Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information and save the changes.</DialogDescription>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Student full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mobile *</label>
                    <Input
                      value={editForm.mobile}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Mobile number"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password (leave blank to keep current)</label>
                    <Input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="New password"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Branch</label>
                    <Select
                      value={editForm.branchId || undefined}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, branchId: v || '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch (optional)" />
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, status: v as UserStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold">Student Profile</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Father Name</label>
                      <Input
                        value={editForm.fatherName}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, fatherName: e.target.value }))}
                        placeholder="Father's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mother Name</label>
                      <Input
                        value={editForm.motherName}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, motherName: e.target.value }))}
                        placeholder="Mother's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date of Birth</label>
                      <Input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, dob: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gender</label>
                      <Input
                        value={editForm.gender}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                        placeholder="Gender"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Blood Group</label>
                      <Input
                        value={editForm.bloodGroup}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                        placeholder="Blood group"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Mobile</label>
                      <Input
                        value={editForm.primaryMobile}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, primaryMobile: e.target.value }))}
                        placeholder="Primary mobile"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary Mobile</label>
                      <Input
                        value={editForm.secondaryMobile}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, secondaryMobile: e.target.value }))}
                        placeholder="Secondary mobile"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Institute</label>
                      <Select
                        value={editForm.instituteId || undefined}
                        onValueChange={(v) => setEditForm((prev) => ({ ...prev, instituteId: v || '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select institute (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutes.map((institute) => (
                            <SelectItem key={institute.id} value={institute.id}>
                              {institute.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Address</label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        placeholder="Address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Registration Number</label>
                      <Input
                        value={editForm.registrationNumber}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                        placeholder="Registration number"
                      />
                    </div>
                  </div>
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
