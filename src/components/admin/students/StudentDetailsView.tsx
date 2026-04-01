'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  GraduationCap,
  History,
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
  Eye,
  Wallet,
  Banknote,
  Smartphone,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import {
  getEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  settleEnrollment,
  type Enrollment as EnrollmentType,
  type EnrollmentStatusType,
} from '@/lib/api/enrollments';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { EnrollmentForm } from '@/components/admin/enrollments/EnrollmentForm';
import { EnrollmentDetailsView } from '@/components/admin/enrollments/EnrollmentDetailsView';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { AddEnrollmentForm } from '@/components/admin/students/AddEnrollmentForm';
import { getInvoices, getInvoiceById } from '@/lib/api/invoices';
import type { Invoice } from '@/types/invoice';
import { InvoiceDetailsView } from '@/components/admin/invoices/InvoiceDetailsView';

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

function money(n: unknown): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function paymentMethodLabel(m: string): string {
  const u = String(m).toUpperCase();
  if (u === 'CASH') return 'Cash';
  if (u === 'BKASH') return 'bKash';
  if (u === 'BANK') return 'Bank';
  if (u === 'GATEWAY') return 'Online / gateway';
  return m || '—';
}

export function StudentDetailsView({ student }: StudentDetailsViewProps) {
  const profile = student.studentProfile;
  const { toast } = useToast();
  const { openModal } = useModalStore();
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>(() => student.enrollments ?? []);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [studentTab, setStudentTab] = useState('overview');

  const loadEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      const res = await getEnrollments({ studentUserId: student.id, limit: 300 });
      if (res.success && res.data) setEnrollments(res.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not load enrollments', variant: 'destructive' });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await getInvoices({ studentUserId: student.id, limit: 100 });
      if (res.success && res.data) setInvoices(res.data);
    } catch {
      toast({ title: 'Error', description: 'Could not load invoices', variant: 'destructive' });
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
    loadInvoices();
  }, [student.id]);

  const programEnrollmentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of enrollments) {
      const pid = e.course?.program?.id;
      if (!pid) continue;
      m.set(pid, (m.get(pid) || 0) + 1);
    }
    return m;
  }, [enrollments]);

  const invoiceTotals = useMemo(() => {
    let due = 0;
    let paid = 0;
    for (const inv of invoices) {
      due += Number(inv.dueAmount);
      paid += Number(inv.paidAmount);
    }
    return { due, paid };
  }, [invoices]);

  const enrollmentKindStats = useMemo(() => {
    let monthly = 0;
    let oneTime = 0;
    const programs = new Set<string>();
    for (const e of enrollments) {
      if (e.course?.billingType === 'MONTHLY') monthly += 1;
      else oneTime += 1;
      if (e.course?.program?.id) programs.add(e.course.program.id);
    }
    return { monthly, oneTime, programCount: programs.size };
  }, [enrollments]);

  const programSiblingCount = (e: EnrollmentType) => {
    const pid = e.course?.program?.id;
    if (!pid) return 1;
    return programEnrollmentCounts.get(pid) || 1;
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const res = await getInvoiceById(invoiceId);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Could not load invoice', variant: 'destructive' });
        return;
      }
      openModal({
        title: 'Invoice',
        description: res.data.branch?.name,
        className: 'sm:max-w-4xl',
        content: <InvoiceDetailsView invoice={res.data} />,
      });
    } catch {
      toast({ title: 'Error', description: 'Could not load invoice', variant: 'destructive' });
    }
  };

  const refreshEnrollmentsAndBilling = async () => {
    await loadEnrollments();
    await loadInvoices();
  };

  const handleViewEnrollment = async (enrollment: EnrollmentType) => {
    try {
      const res = await getEnrollmentById(enrollment.id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Could not load enrollment', variant: 'destructive' });
        return;
      }
      openModal({
        title: 'Enrollment details',
        description: res.data.course?.name,
        className: 'sm:max-w-3xl',
        content: (
          <EnrollmentDetailsView
            enrollment={res.data}
            onRequestSettle={() => handleSettleEnrollmentModal(enrollment.id)}
            onAfterMutation={refreshEnrollmentsAndBilling}
          />
        ),
      });
    } catch {
      toast({ title: 'Error', description: 'Could not load enrollment', variant: 'destructive' });
    }
  };

  const handleSettleEnrollmentModal = (enrollmentId: string) => {
    openModal({
      title: 'Settle dues',
      description: 'Confirm settlement for this enrollment.',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Settle invoices"
          description="Mark outstanding course-related invoices as paid for this student?"
          variant="info"
          onConfirm={async () => {
            await settleEnrollment(enrollmentId);
            await refreshEnrollmentsAndBilling();
            toast({ title: 'Settled', variant: 'success' });
          }}
        />
      ),
    });
  };

  const handleEditEnrollment = async (enrollment: EnrollmentType) => {
    try {
      const res = await getEnrollmentById(enrollment.id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Could not load enrollment', variant: 'destructive' });
        return;
      }
      openModal({
        title: 'Edit enrollment',
        description: 'Batch, status, monthly billing start.',
        className: 'sm:max-w-3xl',
        content: <EnrollmentForm enrollment={res.data} onSuccess={refreshEnrollmentsAndBilling} />,
      });
    } catch {
      toast({ title: 'Error', description: 'Could not load enrollment', variant: 'destructive' });
    }
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
              await refreshEnrollmentsAndBilling();
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
              await refreshEnrollmentsAndBilling();
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
        description: 'Pick courses, then payment and confirm.',
        className: 'sm:max-w-2xl lg:max-w-4xl',
      content: (
        <AddEnrollmentForm
          studentId={student.id}
          defaultBranchId={student.branchId || ''}
          onSuccess={refreshEnrollmentsAndBilling}
        />
      ),
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
        {/* Profile header */}
        <div className="border-b border-slate-200 bg-white px-6 py-8 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:gap-10">
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-slate-100 bg-slate-50 text-3xl font-black text-slate-800 shadow-sm">
                  {student.fullName.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-emerald-500 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center md:justify-start">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{student.fullName}</h1>
                <Badge
                  variant="outline"
                  className={cn('rounded-lg px-3 py-0.5 text-[10px] font-bold uppercase', getStatusBadgeClass(student.status))}
                >
                  {student.status}
                </Badge>
              </div>
              <p className="font-mono text-xs font-semibold text-slate-500">
                Reg · {profile?.registrationNumber || '—'}
              </p>

              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-800 ring-1 ring-violet-100">
                  Monthly courses · {enrollmentKindStats.monthly}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-800 ring-1 ring-sky-100">
                  One-time · {enrollmentKindStats.oneTime}
                </span>
                <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                  Programs · {enrollmentKindStats.programCount}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900 ring-1 ring-amber-100">
                  Due ৳{money(invoiceTotals.due)}
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start md:gap-6">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">{student.mobile}</span>
                </div>
                {student.email ? (
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <Mail className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span className="truncate text-sm font-semibold text-slate-700">{student.email}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">{student.branch?.name || 'Branch'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={studentTab} onValueChange={setStudentTab} className="w-full">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-2">
            <TabsList className="bg-transparent gap-6 h-12 p-0 flex-wrap">
              {[
                { label: 'Overview', value: 'overview', icon: LayoutDashboard },
                { label: 'Profile', value: 'identity', icon: Contact },
                { label: 'Courses', value: 'courses', icon: GraduationCap },
                { label: 'Payments', value: 'payments', icon: Wallet },
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
            {/* Overview — bento layout */}
            <TabsContent value="overview" className="m-0">
              <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
                <div className="space-y-6 lg:col-span-7">
                  <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Overview</h3>
                        <p className="mt-1 text-lg font-black text-slate-900">এক নজরে</p>
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        যোগদান: {format(new Date(student.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      {[
                        {
                          label: 'Enrollments',
                          value: student._count?.enrollments ?? 0,
                          icon: Layers,
                          tone: 'indigo',
                        },
                        {
                          label: 'মাসিক',
                          value: enrollmentKindStats.monthly,
                          icon: GraduationCap,
                          tone: 'violet',
                        },
                        {
                          label: 'Exams',
                          value: student._count?.examAttempts ?? 0,
                          icon: Activity,
                          tone: 'emerald',
                        },
                        {
                          label: 'Blood',
                          value: profile?.bloodGroup || '—',
                          icon: HeartPulse,
                          tone: 'rose',
                        },
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition hover:border-slate-200 hover:bg-white"
                        >
                          <stat.icon
                            className={cn(
                              'mb-3 h-5 w-5',
                              stat.tone === 'indigo' && 'text-indigo-600',
                              stat.tone === 'violet' && 'text-violet-600',
                              stat.tone === 'emerald' && 'text-emerald-600',
                              stat.tone === 'rose' && 'text-rose-600',
                            )}
                          />
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                          <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-indigo-500" />
                      Institution
                    </h3>
                    <dl className="grid gap-6 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
                        <dt className="text-[9px] font-black uppercase tracking-widest text-slate-400">Registration</dt>
                        <dd className="mt-2 font-mono text-lg font-black text-slate-900">
                          {profile?.registrationNumber || 'N/A'}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
                        <dt className="text-[9px] font-black uppercase tracking-widest text-slate-400">Institute</dt>
                        <dd className="mt-2 text-base font-bold text-slate-700">{profile?.institute?.name || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="space-y-6 lg:col-span-5">
                  <div className="rounded-3xl border border-amber-200/80 bg-linear-to-b from-amber-50/95 to-white p-6 shadow-sm sm:p-8">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-900">
                        <Wallet className="h-4 w-4" />
                        Billing
                      </h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl border-amber-200 bg-white text-xs font-bold text-amber-950"
                        onClick={() => setStudentTab('payments')}
                      >
                        <Receipt className="mr-1.5 h-3.5 w-3.5" />
                        সব ইনভয়েস
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl bg-white/90 py-4 shadow-sm ring-1 ring-amber-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-800/80">Due</p>
                        <p className="mt-1 text-lg font-black text-amber-950">৳{money(invoiceTotals.due)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/90 py-4 shadow-sm ring-1 ring-emerald-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-800/80">Paid</p>
                        <p className="mt-1 text-lg font-black text-emerald-800">৳{money(invoiceTotals.paid)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/90 py-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Count</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{invoices.length}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-[11px] font-medium leading-relaxed text-amber-950/70">
                      অফলাইন ভর্তি, ডিস্কাউন্ট রেফারেন্স ও পেমেন্ট এখানে দেখা যাবে।
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">Quick actions</p>
                    <p className="mt-1 text-sm font-bold text-slate-400">এক ক্লিকে পরবর্তী ধাপ</p>
                    <div className="mt-6 grid gap-3">
                      <Button
                        type="button"
                        className="h-12 justify-between rounded-2xl border border-white/10 bg-white/5 px-4 font-bold text-white hover:bg-white/10"
                        onClick={handleAddEnrollment}
                      >
                        নতুন কোর্স / ভর্তি
                        <Plus className="h-5 w-5 text-indigo-300" />
                      </Button>
                      <Button
                        type="button"
                        className="h-12 justify-between rounded-2xl border border-white/10 bg-white/5 px-4 font-bold text-white hover:bg-white/10"
                        onClick={() => setStudentTab('courses')}
                      >
                        কোর্স তালিকা
                        <GraduationCap className="h-5 w-5 text-violet-300" />
                      </Button>
                      <Button
                        type="button"
                        className="h-12 justify-between rounded-2xl border border-white/10 bg-white/5 px-4 font-bold text-white hover:bg-white/10"
                        onClick={() => setStudentTab('payments')}
                      >
                        পেমেন্ট
                        <CreditCard className="h-5 w-5 text-emerald-300" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Profile tab */}
            <TabsContent value="identity" className="m-0">
              <div className="mx-auto max-w-5xl space-y-8">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Student profile</h2>
                  <p className="mt-1 text-sm text-slate-500">Contact, guardians, and address on file.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Father's name", value: profile?.fatherName },
                    { label: "Mother's name", value: profile?.motherName },
                    { label: "Father's mobile", value: profile?.fatherMobile },
                    { label: "Mother's mobile", value: profile?.motherMobile },
                    { label: 'Date of birth', value: profile?.dob ? format(new Date(profile.dob), 'dd-MM-yyyy') : null },
                    { label: 'Gender', value: profile?.gender },
                    { label: 'Primary mobile', value: profile?.primaryMobile || student.mobile },
                    { label: 'Secondary mobile', value: profile?.secondaryMobile },
                    {
                      label: 'SMS alerts',
                      value: Array.isArray(profile?.smsAlertTo) ? profile.smsAlertTo.join(', ') : null,
                    },
                    {
                      label: 'SSC GPA',
                      value:
                        typeof profile?.sscInfo === 'object' && profile.sscInfo?.gpa != null
                          ? String(profile.sscInfo.gpa)
                          : null,
                    },
                    {
                      label: 'HSC GPA',
                      value:
                        typeof profile?.hscInfo === 'object' && profile.hscInfo?.gpa != null
                          ? String(profile.hscInfo.gpa)
                          : null,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{item.value?.trim() ? item.value : '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    Address
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {profile?.address?.trim() ? profile.address : 'No address on file.'}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Courses Tab Content */}
            <TabsContent value="courses" className="m-0 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">
                    <GraduationCap className="h-5 w-5" />
                    Courses & programs
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    প্রোগ্রাম অনুযায়ী একাধিক কোর্স বা একক কোর্স · প্রতিটি সারিতে <strong>Online / Offline</strong> = কোর্স
                    ডেলিভারি (কেন্দ্রে / রিমোট), পেমেন্ট টাইমিং নয়
                  </p>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Program overview</h4>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {programGroups.length} program{programGroups.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              
              <div className="grid gap-3">
                {enrollments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-black text-slate-600">No enrollments yet</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Use <span className="font-black text-slate-700">New Enrollment</span> to add courses and create invoices.
                    </p>
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center text-sm font-bold text-amber-900">
                    No enrollments match the status filter. Choose &quot;ALL STATUS&quot; or another filter.
                  </div>
                ) : (
                  programGroups.map((group) => (
                    <div key={group.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between bg-slate-50/50 px-5 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className="h-6 w-6 rounded border border-slate-200 bg-white flex items-center justify-center">
                              <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                           </div>
                           <p className="text-sm font-black text-slate-800">{group.name}</p>
                        </div>
                        <Badge variant="secondary" className="rounded-md bg-white text-[9px] font-black uppercase px-2 py-0 border border-slate-200 text-slate-500">
                          {group.courses.length} course{group.courses.length === 1 ? '' : 's'}
                        </Badge>
                      </div>
                      
                      <div className="divide-y divide-slate-50">
                        {group.courses.map((c) => (
                          <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                            <div className="flex min-w-0 flex-col gap-2">
                              <span className="text-sm font-bold text-slate-700">{c.course?.name}</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <CourseDeliveryBadge type={c.course?.type} />
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'rounded-md px-2 py-0 text-[8px] font-black uppercase tracking-wider',
                                    c.course?.billingType === 'MONTHLY'
                                      ? 'border-violet-200 bg-violet-50 text-violet-800'
                                      : 'border-sky-200 bg-sky-50 text-sky-800'
                                  )}
                                >
                                  {c.course?.billingType === 'MONTHLY' ? 'মাসিক বিলিং' : 'এককালীন ফি'}
                                </Badge>
                                {c.course?.billingType === 'MONTHLY' && c.billingStartMonth ? (
                                  <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-2 py-0 text-[8px] font-black uppercase text-slate-600">
                                    শুরু {c.billingStartMonth}
                                  </Badge>
                                ) : null}
                                {programSiblingCount(c) > 1 ? (
                                  <Badge variant="outline" className="rounded-md border-indigo-200 bg-indigo-50 px-2 py-0 text-[8px] font-black uppercase text-indigo-800">
                                    প্রোগ্রাম জুড়ে {programSiblingCount(c)} কোর্স
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="rounded-md border-slate-100 bg-slate-50 px-2 py-0 text-[8px] font-black uppercase text-slate-500">
                                    একক কোর্স ভর্তি
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">
                                {c.batch?.name || 'Unassigned batch'} · ফি ৳{money(c.course?.fee)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={cn("rounded-md text-[9px] font-black uppercase px-2 py-0 border-none", getStatusBadgeClass(String(c.status)))}>
                                {c.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 focus:ring-0 focus:outline-none focus:ring-offset-0">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 bg-white shadow-xl">
                                  <DropdownMenuItem
                                    className="cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg px-3 py-2"
                                    onClick={() => handleViewEnrollment(c)}
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg px-3 py-2" onClick={() => handleEditEnrollment(c)}>
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg px-3 py-2" onClick={() => handleCancelEnrollment(c)}>
                                    <Ban className="h-3 w-3 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg px-3 py-2" onClick={() => handleDeleteEnrollment(c)}>
                                    <Trash2 className="h-3 w-3 mr-2" />
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

            <TabsContent value="payments" className="m-0 space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">
                    <Receipt className="h-5 w-5" />
                    Invoices & payments
                  </h3>
                  <p className="mt-1 max-w-xl text-sm font-medium text-slate-500">
                    ক্যাশ, ব্যাংক, বিকাশ বা গেটওয়ে পেমেন্ট ইনভয়েসের সাথে সংরক্ষিত। নতুন ভর্তিতে “Add course” থেকে ইনভয়েস ও পেমেন্ট
                    রেকর্ড করুন।
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 font-bold"
                  disabled={loadingInvoices}
                  onClick={() => loadInvoices()}
                >
                  Refresh
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-800">Total outstanding</p>
                  <p className="mt-1 text-2xl font-black text-amber-900">৳{money(invoiceTotals.due)}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Total paid</p>
                  <p className="mt-1 text-2xl font-black text-emerald-900">৳{money(invoiceTotals.paid)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Invoices</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{invoices.length}</p>
                </div>
              </div>

              {loadingInvoices ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <Wallet className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-black text-slate-600">No invoices for this student yet</p>
                  <p className="mt-2 text-xs font-medium text-slate-400">
                    Use <strong>Add course</strong> with “Create admission invoice” or generate monthly dues from the invoices page.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Payable</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Due</th>
                        <th className="px-4 py-3">Payments</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="bg-white hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">{inv.id.slice(0, 10)}…</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-600">{inv.branch?.name || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-600">{inv.month || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[9px] font-black uppercase">
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">৳{money(inv.payableAmount)}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">৳{money(inv.paidAmount)}</td>
                          <td className="px-4 py-3 text-right font-bold text-amber-800">৳{money(inv.dueAmount)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {(inv.payments && inv.payments.length > 0
                              ? inv.payments
                              : []
                            )
                              .slice(0, 2)
                              .map((p) => (
                                <div key={p.id} className="flex items-center gap-1 font-bold">
                                  {String(p.method).toUpperCase() === 'CASH' ? (
                                    <Banknote className="h-3 w-3 shrink-0 text-emerald-600" />
                                  ) : (
                                    <Smartphone className="h-3 w-3 shrink-0 text-indigo-600" />
                                  )}
                                  <span>
                                    {paymentMethodLabel(p.method)} · ৳{money(p.amount)}
                                  </span>
                                </div>
                              ))}
                            {inv.payments && inv.payments.length > 2 ? (
                              <span className="text-[10px] text-slate-400">+{inv.payments.length - 2} more</span>
                            ) : null}
                            {!inv.payments?.length ? <span className="text-slate-400">—</span> : null}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 rounded-lg font-bold text-indigo-700"
                              onClick={() => handleViewInvoice(inv.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
