'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Building2, CreditCard, Download, Droplets, Edit2,
  Eye, GraduationCap, Mail, MapPin, Phone, RefreshCw, User,
} from 'lucide-react';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBranches } from '@/lib/api/branches';
import { getEnrollments, type Enrollment as ApiEnrollment } from '@/lib/api/enrollments';
import { getInstituteById } from '@/lib/api/institutes';
import { getInvoicePdfUrl, getInvoices } from '@/lib/api/invoices';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getStudentProfileByRegistrationNumber, getStudentProfileByUserId } from '@/lib/api/student-profiles';
import { getUserById } from '@/lib/api/users';
import type { Invoice } from '@/types/invoice';
import { StudentAdminBadge as AppBadge } from '@/features/admin/students/components/StudentAdminBadge';
import { EditStudentModal } from '@/features/admin/students/modals/EditStudentModal';
import { ManageEnrollmentModal } from '@/features/admin/students/enrollment/ManageEnrollmentModal';
import type {
  BranchOption, Course, Enrollment, Program, Student,
} from '@/features/admin/students';
import { avatarHue, fmt, fmtMonth, normPdfUrl, toLocalEnrollment } from '@/features/admin/students';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === 'PAID') return 'green';
  if (s === 'DUE' || s === 'ISSUED') return 'red';
  if (s === 'PARTIAL') return 'amber';
  if (s === 'WAIVED') return 'blue';
  return 'slate';
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-900 font-medium">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const params = useParams();
  const registrationNumber = params.registrationNumber as string;
  const router = useRouter();
  const { toast } = useToast();
  const showToast = (msg: string, type = 'success') =>
    toast({ title: msg, variant: type === 'error' ? 'destructive' : 'default' });

  // Data state
  const [student, setStudent] = useState<Student | null>(null);
  const [instituteName, setInstituteName] = useState('');
  const [apiEnrollments, setApiEnrollments] = useState<ApiEnrollment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [userId, setUserId] = useState('');
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  // UI state
  const [showEdit, setShowEdit] = useState(false);
  const [manageModal, setManageModal] = useState<{ enrollment: Enrollment } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    // Step 1: resolve userId from registration number
    let profileByRegRes;
    try {
      profileByRegRes = await getStudentProfileByRegistrationNumber(registrationNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // apiRequest throws with the server message on non-2xx;
      // treat "not found" messages as 404, everything else as a load error
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('404')) {
        setNotFound(true);
      } else {
        setFetchError(msg || 'Failed to load student data. Please try again.');
      }
      return;
    }
    if (!profileByRegRes.success || !profileByRegRes.data) { setNotFound(true); return; }
    const resolvedUserId = profileByRegRes.data.userId;
    setUserId(resolvedUserId);

    const [userRes, profileRes, enrollRes, invoiceRes, programRes, courseRes, branchRes] =
      await Promise.all([
        getUserById(resolvedUserId),
        getStudentProfileByUserId(resolvedUserId),
        getEnrollments({ studentUserId: resolvedUserId, limit: 50 }),
        getInvoices({ studentUserId: resolvedUserId, limit: 12 }),
        getPrograms(),
        getCourses({ limit: 200 }),
        getBranches(),
      ]);

    if (userRes.success && userRes.data) {
      const u = userRes.data;
      const prof = profileRes.success ? profileRes.data : null;
      setStudent({
        id: u.id,
        regNo: u.studentProfile?.registrationNumber ?? '—',
        fullName: u.fullName,
        mobile: u.mobile,
        email: u.email ?? null,
        status: u.status as 'ACTIVE' | 'BLOCKED',
        branchId: u.branchId ?? '',
        createdAt: u.createdAt ?? '',
        fatherName: u.studentProfile?.fatherName ?? undefined,
        motherName: u.studentProfile?.motherName ?? undefined,
        fatherMobile: u.studentProfile?.fatherMobile ?? undefined,
        motherMobile: u.studentProfile?.motherMobile ?? undefined,
        bloodGroup: u.studentProfile?.bloodGroup ?? undefined,
        gender: u.studentProfile?.gender ?? undefined,
        address: u.studentProfile?.address ?? undefined,
        smsAlertTo: u.studentProfile?.smsAlertTo ?? [],
      });

      if (prof?.instituteId) {
        getInstituteById(prof.instituteId).then(r => {
          if (r.success && r.data) {
            setInstituteName(`${r.data.name}${r.data.type ? ` (${r.data.type})` : ''}`);
          }
        }).catch(() => {});
      }
    }

    if (enrollRes.success && enrollRes.data) setApiEnrollments(enrollRes.data);
    if (invoiceRes.success && invoiceRes.data) setInvoices(invoiceRes.data as unknown as Invoice[]);
    if (programRes.success && programRes.data) setPrograms(programRes.data as Program[]);
    if (courseRes.success && courseRes.data) {
      setAllCourses(courseRes.data.map(c => ({
        id: c.id,
        name: c.name,
        programId: (c as { programId?: string }).programId ?? '',
        fee: Number((c as { fee?: unknown }).fee ?? 0),
        type: (c.type === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as 'OFFLINE' | 'ONLINE',
        startMonth: (c as { startMonth?: string | null }).startMonth ?? '',
        endMonth: (c as { endMonth?: string | null }).endMonth ?? '',
        batches: [],
      })));
    }
    if (branchRes.success && branchRes.data) {
      setBranches(branchRes.data.map(b => ({ id: b.id, name: b.name })));
    }
  };

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setFetchError('');
    fetchData().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('404')) {
        setNotFound(true);
      } else {
        setFetchError(msg || 'Failed to load student data.');
      }
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationNumber]);

  const refreshEnrollments = async () => {
    if (!userId) return;
    setRefreshing(true);
    const [enrollRes, invoiceRes] = await Promise.all([
      getEnrollments({ studentUserId: userId, limit: 50 }),
      getInvoices({ studentUserId: userId, limit: 12 }),
    ]);
    if (enrollRes.success && enrollRes.data) setApiEnrollments(enrollRes.data);
    if (invoiceRes.success && invoiceRes.data) setInvoices(invoiceRes.data as unknown as Invoice[]);
    setRefreshing(false);
  };

  const invoiceFileName = (invoice: Pick<Invoice, 'id' | 'month'>) =>
    `invoice-${student?.regNo ?? registrationNumber}-${invoice.month || 'one-time'}-${invoice.id.slice(0, 8)}.pdf`;

  const getInvoicePdfPath = async (invoiceId: string) => {
    const res = await getInvoicePdfUrl(invoiceId);
    return res.data?.pdfUrl ? normPdfUrl(res.data.pdfUrl) : null;
  };

  const openInvoicePdf = async (invoiceId: string) => {
    setPdfLoading(`view:${invoiceId}`);
    try {
      const path = await getInvoicePdfPath(invoiceId);
      if (path) window.open(path, '_blank', 'noopener,noreferrer');
    } finally {
      setPdfLoading(null);
    }
  };

  const downloadInvoicePdf = async (invoice: Pick<Invoice, 'id' | 'month'>) => {
    setPdfLoading(`download:${invoice.id}`);
    try {
      const path = await getInvoicePdfPath(invoice.id);
      if (!path) return;
      const a = document.createElement('a');
      a.href = path;
      a.download = invoiceFileName(invoice);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setPdfLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50 flex items-center justify-center">
        <p className="text-slate-400">Loading student profile…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-600 font-semibold">Error loading student</p>
        <p className="text-slate-500 text-sm max-w-sm text-center">{fetchError}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setFetchError(''); setLoading(true); fetchData().catch((err: unknown) => { const msg = err instanceof Error ? err.message : ''; setFetchError(msg || 'Failed to load.'); }).finally(() => setLoading(false)); }}>Retry</Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/students')}>← Back to Students</Button>
        </div>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 font-semibold">Student not found — Reg: {registrationNumber}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/students')}>← Back to Students</Button>
      </div>
    );
  }

  const hue = avatarHue(student.fullName);
  const branchName = branches.find(b => b.id === student.branchId)?.name ?? '';
  const enrollments = apiEnrollments.map(toLocalEnrollment);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push('/admin/students')}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Students
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-sm font-bold text-slate-900 truncate">{student.fullName}</span>
      </div>

      {/* Student header card */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 mb-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shrink-0"
          style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}
        >
          {student.fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 truncate">{student.fullName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-slate-500">
              Reg: <strong className="text-rose-700 font-mono">{student.regNo}</strong>
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Phone className="h-3 w-3" /> {student.mobile}
            </span>
            {student.email && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Mail className="h-3 w-3" /> {student.email}
              </span>
            )}
            <AppBadge label={student.status} color={student.status === 'ACTIVE' ? 'green' : 'red'} />
            {branchName && <AppBadge label={branchName} color="blue" />}
            {student.createdAt && (
              <span className="text-xs text-slate-400">
                Joined {new Date(student.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEdit(true)}
            className="gap-1.5 border-slate-200"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-auto">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            Enrollments ({apiEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Personal info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Personal Information</p>
              <InfoRow icon={User} label="Father's Name" value={student.fatherName} />
              <InfoRow icon={Phone} label="Father's Mobile" value={student.fatherMobile} />
              <InfoRow icon={User} label="Mother's Name" value={student.motherName} />
              <InfoRow icon={Phone} label="Mother's Mobile" value={student.motherMobile} />
              <InfoRow icon={Droplets} label="Blood Group" value={student.bloodGroup} />
              <InfoRow icon={User} label="Gender" value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : undefined} />
              <InfoRow icon={MapPin} label="Address" value={student.address} />
              {student.smsAlertTo && student.smsAlertTo.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">SMS Alerts To</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {student.smsAlertTo.map(s => (
                        <AppBadge key={s} label={s.charAt(0) + s.slice(1).toLowerCase()} color="slate" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!student.fatherName && !student.motherName && !student.bloodGroup && !student.gender && !student.address && (
                <p className="text-sm text-slate-400 text-center py-4">No additional profile data</p>
              )}
            </div>

            {/* Institute info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Institute & Academic</p>
              {instituteName ? (
                <InfoRow icon={GraduationCap} label="Institute" value={instituteName} />
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No institute assigned</p>
              )}
              {branchName && <InfoRow icon={Building2} label="Branch" value={branchName} />}

              {/* Summary stats */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 mt-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{apiEnrollments.filter(e => e.status === 'ACTIVE' || e.status === 'WAITLISTED').length}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">Active Programs</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-slate-900">
                    {invoices.filter(iv => (iv.status as string) === 'DUE' || (iv.status as string) === 'PARTIAL' || (iv.status as string) === 'ISSUED').length}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">Pending Invoices</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Enrollments ───────────────────────────────────────────────── */}
        <TabsContent value="enrollments">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-slate-500">{apiEnrollments.length} enrollment(s)</p>
            <button
              onClick={refreshEnrollments}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {apiEnrollments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center shadow-sm">
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400">No enrollments yet</p>
            </div>
          ) : apiEnrollments.map((enr, i) => {
            const program = programs.find(p => p.id === enr.programId);
            const activeCourses = enr.enrollmentCourses?.filter(ec => (ec as { status?: string }).status !== 'CANCELLED') ?? [];
            const totalFee = activeCourses.reduce((sum, ec) => sum + Number(ec.course?.fee ?? 0), 0);
            const discount = Number(enr.monthlyDiscount ?? 0);
            const netFee = totalFee - discount;
            const localEnrollment = enrollments[i];

            return (
              <div key={enr.id} className="bg-white border border-slate-200 rounded-2xl mb-4 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm text-slate-900">
                      {enr.program?.name ?? program?.name ?? enr.programId}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <AppBadge
                        label={enr.status}
                        color={['ACTIVE', 'WAITLISTED'].includes(enr.status) ? 'green' : 'red'}
                      />
                      <AppBadge label={enr.billingType ?? 'MONTHLY'} color="blue" />
                      {enr.billingStartMonth && (
                        <span className="text-xs text-slate-500">From: {fmtMonth(enr.billingStartMonth)}</span>
                      )}
                      {discount > 0 && (
                        <span className="text-xs text-slate-500">
                          Discount: <strong className="text-rose-600">{fmt(discount)}/mo</strong>
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        Net: <strong className="text-emerald-600">{fmt(netFee)}/mo</strong>
                      </span>
                    </div>
                  </div>
                  {localEnrollment && (
                    <Button
                      size="sm"
                      onClick={() => setManageModal({ enrollment: localEnrollment })}
                      className="gap-1.5 bg-slate-900 text-white hover:bg-indigo-600 transition-all shrink-0"
                    >
                      Manage Enrollment
                    </Button>
                  )}
                </div>

                {/* Courses */}
                {activeCourses.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-100">
                          {['Course', 'Type', 'Batch', 'Fee', 'Start'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeCourses.map(ec => (
                          <tr key={ec.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <p className="font-semibold text-sm text-slate-900">{ec.course?.name ?? ec.courseId}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              {ec.course?.type && (
                                <AppBadge
                                  label={ec.course.type}
                                  color={ec.course.type === 'OFFLINE' ? 'amber' : 'blue'}
                                />
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {ec.batch?.name ?? <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-semibold text-rose-700">
                              {ec.course?.fee ? `${fmt(Number(ec.course.fee))}/mo` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">
                              {(ec as { startMonth?: string | null }).startMonth
                                ? fmtMonth((ec as unknown as { startMonth: string }).startMonth)
                                : ec.course?.startMonth
                                  ? fmtMonth(ec.course.startMonth)
                                  : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ── Invoices ─────────────────────────────────────────────────── */}
        <TabsContent value="invoices">
          {invoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center shadow-sm">
              <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400">No invoices found</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Month', 'Invoice', 'Total', 'Discount', 'Payable', 'Paid', 'Due', 'Status', 'Issued', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(iv => (
                      <tr key={iv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {iv.month ? fmtMonth(iv.month) : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          #{iv.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{fmt(Number(iv.totalAmount ?? 0))}</td>
                        <td className="px-4 py-3 text-xs text-rose-600">
                          {Number(iv.discountAmount ?? 0) > 0 ? `−${fmt(Number(iv.discountAmount))}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">{fmt(Number(iv.payableAmount ?? 0))}</td>
                        <td className="px-4 py-3 text-xs text-emerald-700 font-semibold">{fmt(Number(iv.paidAmount ?? 0))}</td>
                        <td className="px-4 py-3 text-xs text-rose-700 font-semibold">
                          {Number(iv.dueAmount ?? 0) > 0 ? fmt(Number(iv.dueAmount)) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <AppBadge label={iv.status} color={statusColor(iv.status)} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {iv.issuedAt ? new Date(iv.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openInvoicePdf(iv.id)}
                              disabled={pdfLoading === `view:${iv.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40"
                              title="View invoice PDF"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadInvoicePdf(iv)}
                              disabled={pdfLoading === `download:${iv.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                              title="Download invoice PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit modal */}
      {showEdit && (
        <EditStudentModal
          student={student}
          onClose={() => setShowEdit(false)}
          onSave={updated => {
            setStudent(prev => prev ? { ...prev, ...updated } : updated);
            setShowEdit(false);
            showToast(`${updated.fullName}'s profile updated successfully`);
          }}
        />
      )}

      {/* Manage enrollment modal */}
      {manageModal && (
        <ManageEnrollmentModal
          enrollment={manageModal.enrollment}
          allCourses={allCourses}
          programs={programs}
          studentUserId={userId}
          onClose={() => setManageModal(null)}
          onDone={(summary) => {
            const msg = summary.failed > 0
              ? `Updated with ${summary.failed} failure(s).`
              : summary.added > 0 && summary.removed > 0
                ? `${summary.added} added, ${summary.removed} cancelled.`
                : summary.added > 0
                  ? `${summary.added} course(s) added!`
                  : `${summary.removed} course(s) cancelled.`;
            showToast(msg, summary.failed > 0 ? 'error' : 'success');
            refreshEnrollments();
          }}
        />
      )}

      <Toaster />
    </div>
  );
}
