'use client';

import { useState, useEffect } from 'react';
import {
  getStudents,
  deleteStudent,
  getStudentById,
  lookupStudentUser,
  bulkImportStudents,
  exportStudentsUrl,
  type Student,
} from '@/lib/api/students';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getCourses, type Course } from '@/lib/api/courses';
import { getBatches, type Batch } from '@/lib/api/batches';
import { apiRequest } from '@/lib/api';
import type { Institute, ApiResponse } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  Upload,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { EditStudentWizard } from '@/components/admin/students/EditStudentWizard';
import { AddStudentWizard } from '@/components/admin/students/AddStudentWizard';
import { StudentDetailsView } from '@/components/admin/students/StudentDetailsView';
import { BulkImportForm } from '@/components/admin/students/BulkImportForm';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';
import StudentExamTakingPage from '../../student/exams/[id]/page';

export default function StudentsPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal } = useModalStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickLookup, setQuickLookup] = useState('');
  const [quickLookupLoading, setQuickLookupLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  const statusOptions = ['all', 'ACTIVE', 'BLOCKED', 'PENDING'];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bid = new URLSearchParams(window.location.search).get('branchId');
    if (bid) setBranchFilter(bid);
  }, []);

  useEffect(() => {
    loadBranches();
    loadCourses();
    loadInstitutes();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [statusFilter, branchFilter, courseFilter, batchFilter]);

  useEffect(() => {
    void loadBatchOptions(courseFilter !== 'all' ? courseFilter : undefined);
  }, [courseFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      if (courseFilter !== 'all') params.courseId = courseFilter;
      if (batchFilter !== 'all') params.batchId = batchFilter;
      
      const res = await getStudents(params);
      if (res.success) setStudents(res.data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    const res = await getBranches();
    if (res.success) setBranches(res.data || []);
  };

  const loadCourses = async () => {
    const res = await getCourses({ status: 'ACTIVE', limit: 500 });
    if (res.success) setCourses(res.data || []);
  };

  const loadBatchOptions = async (courseId?: string) => {
    const res = await getBatches({ status: 'ACTIVE', courseId, limit: 500 });
    if (res.success) setBatches(res.data || []);
  };

  const loadInstitutes = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: Institute[] }>('/institutes?limit=500');
      if (res.success) setInstitutes(res.data || []);
    } catch (err) {
      console.error('Failed to load institutes:', err);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'BLOCKED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleViewStudent = async (
    studentId: string,
    initialTab: 'overview' | 'identity' | 'courses' | 'academic' | 'payments' | 'financial' = 'overview',
  ) => {
    try {
      const res = await getStudentById(studentId);
      if (res.success && res.data) {
        if (res.data.role !== 'STUDENT') {
          toast({
            title: 'Not a student',
            description: 'That account is not a student. Use user ID, registration no., or student mobile.',
            variant: 'destructive',
          });
          return;
        }
        openModal({
          title: 'Student Details',
          description: "See this student's info.",
          className: 'sm:max-w-5xl max-h-[92vh] flex flex-col overflow-hidden',
          content: <StudentDetailsView student={res.data} initialTab={initialTab} />,
        });
      } else {
        toast({ title: 'Error', description: res.message || 'Student not found', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load student details', variant: 'destructive' });
    }
  };

  const handleEditStudent = async (studentId: string) => {
    try {
      const res = await getStudentById(studentId);
      if (res.success && res.data) {
        if (res.data.role !== 'STUDENT') {
          toast({
            title: 'Not a student',
            description: 'That account is not a student.',
            variant: 'destructive',
          });
          return;
        }
        openModal({
          title: 'Edit Student',
          description: 'Update profile, then optionally add courses and generate an invoice.',
          className: 'sm:max-w-5xl max-h-[92vh] flex flex-col overflow-hidden',
          content: (
            <EditStudentWizard
              branches={branches}
              institutes={institutes}
              student={res.data}
              onSuccess={loadStudents}
            />
          ),
        });
      } else {
        toast({ title: 'Error', description: res.message || 'Student not found', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load student for editing', variant: 'destructive' });
    }
  };

  const handleQuickOpenStudent = async () => {
    const raw = quickLookup.trim();
    if (!raw) {
      toast({ title: 'Enter a value', description: 'User ID, registration no., or mobile', variant: 'destructive' });
      return;
    }
    try {
      setQuickLookupLoading(true);
      let resolvedId = raw;
      try {
        const lookup = await lookupStudentUser(raw);
        if (lookup.success && lookup.data?.id) {
          resolvedId = lookup.data.id;
          if (lookup.data.matchedBy !== 'id') {
            const via =
              lookup.data.matchedBy === 'registrationNumber' ? 'registration no.' : 'mobile';
            toast({
              title: 'Matched',
              description: `${lookup.data.fullName} (${via})`,
              variant: 'success',
            });
          }
        }
      } catch {
        resolvedId = raw;
      }
      await handleViewStudent(resolvedId);
      setQuickLookup('');
    } finally {
      setQuickLookupLoading(false);
    }
  };

  const handleCreateStudent = () => {
    openModal({
      title: 'Offline admission',
      description: 'Profile → course → payment & invoice in one flow. Roll and password are generated automatically.',
      className: 'sm:max-w-5xl max-h-[90vh]',
      content: <AddStudentWizard branches={branches} institutes={institutes} onSuccess={loadStudents} />,
    });
  };

  const handleOpenBulkImport = () => {
    openModal({
      title: 'Bulk Import Students',
      description: 'Upload CSV or Excel file. Columns: fullName/name, mobile/phone, fatherName, motherName, fatherMobile, motherMobile, registrationNumber (7 digits), email, address, bloodGroup, gender, smsAlertTo (SELF,FATHER,MOTHER).',
      className: 'sm:max-w-lg',
      content: (
        <BulkImportForm
          branches={branches}
          onSuccess={loadStudents}
          onClose={() => {}}
          toast={toast}
        />
      ),
    });
  };

  const handleDeleteStudent = async (studentId: string) => {
    openModal({
      title: 'Delete Student',
      description: 'Delete this student? This cannot be undone.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Delete this student? This cannot be undone."
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteStudent(studentId);
              await loadStudents();
              toast({ title: 'Success', description: 'Student account deleted successfully', variant: 'success' });
            } catch (err: unknown) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const reg = (s.studentProfile?.registrationNumber ?? '').toLowerCase();
    return (
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.mobile.toLowerCase().includes(q) ||
      reg.includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

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
                  placeholder="Search name, email, phone, reg #, or user id…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner outline-none"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Status' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-sm font-medium">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={courseFilter}
              onValueChange={(v) => {
                setCourseFilter(v);
                setBatchFilter('all');
              }}
            >
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-sm font-medium">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id} className="text-sm font-medium">
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex min-w-[220px] max-w-xs flex-1 items-center gap-2">
              <Input
                placeholder="Open: id, roll, mobile…"
                value={quickLookup}
                onChange={(e) => setQuickLookup(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickOpenStudent()}
                className="h-12 rounded-2xl border-slate-200 bg-white text-sm font-bold shadow-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 rounded-2xl border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest"
                disabled={quickLookupLoading}
                onClick={handleQuickOpenStudent}
              >
                Open
              </Button>
            </div>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadStudents}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 px-6 font-black uppercase tracking-widest text-[11px] text-slate-600 shadow-sm hover:bg-slate-50"
              onClick={() => {
                const url = exportStudentsUrl({
                  branchId: branchFilter,
                  courseId: courseFilter,
                  batchId: batchFilter,
                  status: statusFilter,
                  search: searchQuery || undefined,
                });
                window.open(url, '_blank');
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 px-6 font-black uppercase tracking-widest text-[11px] text-slate-600 shadow-sm hover:bg-slate-50"
              onClick={handleOpenBulkImport}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              onClick={handleCreateStudent}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Students</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Student accounts only</p>
            <p className="mt-1 max-w-xl text-xs font-medium text-slate-500">
              This list includes users with the <strong>Student</strong> role. Teachers and staff appear under Teachers / Staff,
              not here.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Students
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No students found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Student</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Contact</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch / Courses</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-base">
                             {student.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{student.fullName}</span>
                             <span className="text-sm font-bold text-slate-500">
                                {student.studentProfile?.registrationNumber || 'No Reg #'}
                             </span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <Phone className="h-3.5 w-3.5 text-emerald-500" />
                             {student.mobile}
                          </div>
                          {student.email && (
                            <div className="flex items-center gap-1.5 text-base font-medium text-slate-400">
                               <Mail className="h-3.5 w-3.5 text-blue-400" />
                               {student.email}
                            </div>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <Building2 className="h-3.5 w-3.5 text-rose-500" />
                             {student.branch?.name || 'Central'}
                          </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-1", getStatusBadgeClass(student.status))}>
                         {student.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewStudent(student.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditStudent(student.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewStudent(student.id, 'payments')}
                          >
                            Payment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
