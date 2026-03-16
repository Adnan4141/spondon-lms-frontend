'use client';

import { useEffect, useState } from 'react';
import { Student } from '@/types/student';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  GraduationCap,
  History,
  Fingerprint,
  HeartPulse,
  MoreVertical,
  Activity,
  CheckCircle2,
  BookOpenCheck,
  Plus,
  Trash2,
  Ban,
  Layers,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Contact,
  CreditCard,
} from 'lucide-react';
import {
  getEnrollments,
  updateEnrollment,
  deleteEnrollment,
  type Enrollment as EnrollmentType,
  type EnrollmentStatusType,
} from '@/lib/api/enrollments';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { EnrollmentForm } from '@/components/admin/enrollments/EnrollmentForm';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { AddEnrollmentForm } from '@/components/admin/students/AddEnrollmentForm';

interface StudentDetailsViewProps {
  student: Student;
}

function getStatusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (s === 'BLOCKED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  if (s === 'PAUSED') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  if (s === 'COMPLETED') return 'bg-indigo-50 text-indigo-700 border-indigo-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export function StudentDetailsView({ student }: StudentDetailsViewProps) {
  const profile = student.studentProfile;
  const { toast } = useToast();
  const { openModal } = useModalStore();
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>(student.enrollments || []);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const loadEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      const res = await getEnrollments({ studentUserId: student.id });
      if (res.success && res.data) setEnrollments(res.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not load enrollments', variant: 'destructive' });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [student.id]);

  const handleEditEnrollment = (enrollment: EnrollmentType) => {
    openModal({
      title: 'Edit enrollment',
      description: 'Update status or batch.',
      className: 'sm:max-w-2xl',
      content: <EnrollmentForm enrollment={enrollment} onSuccess={loadEnrollments} />,
    });
  };

  const handleCancelEnrollment = (enrollment: EnrollmentType) => {
    openModal({
      title: 'Cancel enrollment',
      description: `Cancel ${enrollment.course?.name}?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm cancel"
          description="This will mark the enrollment as cancelled."
          variant="danger"
          onConfirm={async () => {
            try {
              await updateEnrollment(enrollment.id, { status: 'CANCELLED' as EnrollmentStatusType });
              toast({ title: 'Cancelled', description: 'Enrollment cancelled', variant: 'success' });
              await loadEnrollments();
            } catch (err: any) {
              toast({ title: 'Error', description: err.message || 'Failed to cancel', variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const handleDeleteEnrollment = (enrollment: EnrollmentType) => {
    openModal({
      title: 'Remove enrollment',
      description: `Remove ${enrollment.course?.name}? This cannot be undone.`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm remove"
          description="Delete this enrollment permanently?"
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteEnrollment(enrollment.id);
              toast({ title: 'Removed', description: 'Enrollment removed', variant: 'success' });
              await loadEnrollments();
            } catch (err: any) {
              toast({ title: 'Error', description: err.message || 'Failed to remove', variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const handleAddEnrollment = () => {
    openModal({
      title: 'Add course',
      description: 'Assign a new course to this student.',
      className: 'sm:max-w-3xl',
      content: <AddEnrollmentForm studentId={student.id} defaultBranchId={student.branchId || ''} onSuccess={loadEnrollments} />,
    });
  };

  const filteredEnrollments = enrollments.filter((e) =>
    statusFilter === 'all' ? true : String(e.status).toUpperCase() === statusFilter.toUpperCase(),
  );

  const programGroups = Object.values(
    filteredEnrollments.reduce((acc: Record<string, { id: string; name: string; courses: EnrollmentType[] }>, e) => {
      const programId = e.course?.program?.id || 'unknown';
      const programName = e.course?.program?.name || 'No program';
      if (!acc[programId]) acc[programId] = { id: programId, name: programName, courses: [] };
      acc[programId].courses.push(e);
      return acc;
    }, {})
  );

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Header Hero Section */}
        <div className="relative px-8 py-10 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-20 blur-lg transition group-hover:opacity-40" />
              <div className="relative h-28 w-28 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center text-slate-900 text-4xl font-black shadow-xl">
                {student.fullName.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-2xl border-4 border-white bg-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">{student.fullName}</h2>
                  <Badge variant="outline" className={cn("rounded-xl px-4 py-1.5 text-[10px] uppercase tracking-[0.2em]", getStatusBadgeClass(student.status))}>
                    {student.status}
                  </Badge>
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500/80">Student ID: {student.id.slice(0, 12).toUpperCase()}</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-8">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-base font-bold text-slate-600">{student.mobile}</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-base font-bold text-slate-600">{student.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-rose-600" />
                  </div>
                  <span className="text-base font-bold text-slate-600">{student.branch?.name || 'Main Branch'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-2">
            <TabsList className="bg-transparent gap-8 h-12 p-0">
              {[
                { label: 'Overview', value: 'overview', icon: LayoutDashboard },
                { label: 'Student Profile', value: 'identity', icon: Contact },
                { label: 'Course Management', value: 'courses', icon: GraduationCap },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative h-12 rounded-none bg-transparent px-2 text-sm font-black uppercase tracking-[0.2em] text-slate-400 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 border-none transition-all after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-indigo-600 after:opacity-0 data-[state=active]:after:opacity-100"
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="px-8 py-10">
            {/* Overview Tab Content */}
            <TabsContent value="overview" className="m-0 space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: 'Enrollments', value: student._count?.enrollments || 0, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                   { label: 'Exam Attempts', value: student._count?.examAttempts || 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { label: 'Joined Date', value: format(new Date(student.createdAt), 'dd-MM-yyyy'), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                   { label: 'Blood Group', value: profile?.bloodGroup || 'N/A', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
                 ].map((stat, i) => (
                   <div key={i} className="group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                         <stat.icon className="h-6 w-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{stat.value}</p>
                   </div>
                 ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-8">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    Institutional Records
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-slate-50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Number</p>
                        <p className="text-xl font-black text-slate-900">{profile?.registrationNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Affiliated Institute</p>
                        <p className="text-lg font-bold text-slate-700">{profile?.institute?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-400">Quick Actions</h3>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="grid gap-4">
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-800 bg-slate-800/50 text-white hover:bg-slate-800 hover:text-white justify-between px-6" onClick={handleAddEnrollment}>
                      <span className="font-bold">Enroll in New Course</span>
                      <Plus className="h-5 w-5 text-indigo-400" />
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-800 bg-slate-800/50 text-white hover:bg-slate-800 hover:text-white justify-between px-6">
                      <span className="font-bold">Generate Fee Voucher</span>
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Identity Tab Content */}
            <TabsContent value="identity" className="m-0 space-y-10">
               <div className="grid lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">
                        <Fingerprint className="h-5 w-5" />
                        Identity Attributes
                     </h3>
                     <div className="grid gap-4">
                        {[
                          { label: "Father's Name", value: profile?.fatherName },
                          { label: "Mother's Name", value: profile?.motherName },
                          { label: "Date of Birth", value: profile?.dob ? format(new Date(profile.dob), 'dd-MM-yyyy') : null },                          { label: "Gender", value: profile?.gender },
                          { label: "Primary Mobile", value: profile?.primaryMobile || student.mobile },
                          { label: "Secondary Mobile", value: profile?.secondaryMobile },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-6 rounded-[24px] border border-slate-100 bg-slate-50/30 transition-all hover:bg-white hover:shadow-md">
                             <span className="text-sm font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                             <span className="text-base font-black text-slate-900">{item.value || '-'}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-8">
                     <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600">
                        <MapPin className="h-5 w-5" />
                        Residential Information
                     </h3>
                     <div className="relative p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm overflow-hidden min-h-[300px]">
                        <div className="absolute top-0 right-0 p-6">
                           <MapPin className="h-12 w-12 text-slate-100" />
                        </div>
                        <div className="relative z-10 space-y-4">
                           <p className="text-lg font-bold leading-relaxed text-slate-700">
                              {profile?.address || 'No residential address provided in the system profile.'}
                           </p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 opacity-50" />
                     </div>

                     <div className="p-8 rounded-[32px] border border-slate-200 bg-indigo-50/30">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Internal Note</h4>
                        <p className="text-sm font-medium text-slate-600 italic">"Ensure all identity documents are verified during the first week of physical attendance."</p>
                     </div>
                  </div>
               </div>
            </TabsContent>

            {/* Courses Tab Content */}
            <TabsContent value="courses" className="m-0 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">
                    <GraduationCap className="h-5 w-5" />
                    Enrolled Programs
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest">Active & Historical Enrollments</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-black uppercase tracking-widest shadow-sm">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl">
                      <SelectItem value="all">ALL STATUS</SelectItem>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="PAUSED">PAUSED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="h-12 rounded-2xl bg-slate-900 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]"
                    onClick={handleAddEnrollment}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Enrollment
                  </Button>
                </div>
              </div>

              {/* Program overview */}
              <div className="grid gap-4 md:grid-cols-2">
                {programGroups.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                    No program data for these enrollments
                  </div>
                ) : (
                  programGroups.map((group) => (
                    <div key={group.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Program</p>
                          <p className="text-lg font-black text-slate-900">{group.name}</p>
                        </div>
                        <Badge variant="outline" className="rounded-lg bg-slate-50 text-[10px] font-black uppercase px-3 py-1 border-slate-200">
                          {group.courses.length} course{group.courses.length === 1 ? '' : 's'}
                        </Badge>
                      </div>
                          <div className="space-y-2">
                            {group.courses.map((c) => (
                              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800">{c.course?.name}</span>
                                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                                    {c.batch?.name || 'Batch'} / {c.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={cn("rounded-lg text-[10px] font-black uppercase px-3 py-1", getStatusBadgeClass(String(c.status)))}>
                                    {c.status}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-500 hover:text-indigo-600">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200">
                                      <DropdownMenuItem onClick={() => handleEditEnrollment(c)}>Edit</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCancelEnrollment(c)}>
                                        <Ban className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                        Cancel
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteEnrollment(c)}>
                                        <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                )}
              </div>

             
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
