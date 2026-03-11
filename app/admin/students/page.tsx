'use client';

import { useState, useEffect } from 'react';
import {
  getStudents,
  deleteStudent,
  getStudentById,
  type Student,
} from '@/lib/api/students';
import { getBranches, type Branch } from '@/lib/api/branches';
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
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Users,
  Layers,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { StudentForm } from '@/components/admin/students/StudentForm';
import { StudentDetailsView } from '@/components/admin/students/StudentDetailsView';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal } = useModalStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const statusOptions = ['all', 'ACTIVE', 'BLOCKED', 'PENDING'];

  useEffect(() => {
    loadStudents();
    loadBranches();
    loadInstitutes();
  }, [statusFilter, branchFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      
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

  const loadInstitutes = async () => {
    try {
      const res = await apiRequest<ApiResponse<Institute[]>>('/institutes');
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

  const handleViewStudent = async (studentId: string) => {
    try {
      const res = await getStudentById(studentId);
      if (res.success && res.data) {
        openModal({
          title: 'Student Profile Intelligence',
          description: 'Comprehensive overview of biological and academic records.',
          className: 'sm:max-w-4xl',
          content: <StudentDetailsView student={res.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load student details', variant: 'destructive' });
    }
  };

  const handleEditStudent = async (studentId: string) => {
    try {
      const res = await getStudentById(studentId);
      if (res.success && res.data) {
        openModal({
          title: 'Update Student Registry',
          description: 'Refine profile parameters and institutional permissions.',
          className: 'sm:max-w-4xl',
          content: <StudentForm branches={branches} institutes={institutes} student={res.data} onSuccess={loadStudents} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load student for editing', variant: 'destructive' });
    }
  };

  const handleCreateStudent = () => {
    openModal({
      title: 'Authorize New Student',
      description: 'Initialize a new student account and associated bio-data profile.',
      className: 'sm:max-w-4xl',
      content: <StudentForm branches={branches} institutes={institutes} onSuccess={loadStudents} />,
    });
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      await deleteStudent(studentId);
      await loadStudents();
      toast({ title: 'Success', description: 'Student account deleted successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return !q || s.fullName.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.mobile.toLowerCase().includes(q);
  });

  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const blockedCount = students.filter((s) => s.status === 'BLOCKED').length;
  const totalEnrollments = students.reduce((sum, s) => sum + (s._count?.enrollments || 0), 0);

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Registry', value: totalStudents, color: 'from-blue-600 to-cyan-500', icon: Users },
          { label: 'Active Learners', value: activeCount, color: 'from-emerald-600 to-teal-500', icon: Layers },
          { label: 'Blocked Access', value: blockedCount, color: 'from-rose-600 to-pink-600', icon: ShieldCheck },
          { label: 'Enrollments', value: totalEnrollments, color: 'from-indigo-600 to-purple-600', icon: GraduationCap },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Filter & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  placeholder="Search by full name, email, or mobile reference..."
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

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadStudents}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateStudent}
          >
            <Plus className="mr-2 h-4 w-4" />
            Authorize Student
          </Button>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Student Registry</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Institutional demographic data</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalStudents} Enrolled Students
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No matching students identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Contact Reference</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Context</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Classification</TableHead>
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
                             <span className="text-base font-medium text-slate-400">UID: {student.id.slice(0, 8)}...</span>
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
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <Building2 className="h-3.5 w-3.5 text-rose-500" />
                             {student.branch?.name || 'Central'}
                          </div>
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-400">
                             <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                             {student._count?.enrollments || 0} active plans
                          </div>
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
