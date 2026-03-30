'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { createStudent } from '@/lib/api/students';
import { getPrograms, getProgramById, type Program } from '@/lib/api/programs';
import type { Course } from '@/lib/api/courses';
import { offlineAdmission, type PaymentMethodType } from '@/lib/api/enrollments';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Branch, Institute, SmsAlertTo, UserStatus } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { InstituteCombobox } from '@/components/admin/students/StudentForm';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { distributeProportionalByFee } from '@/lib/admission-distribution';
import {
  validateAdmissionPayment,
  netPayableAfterAdjustments,
  type AdmissionPaymentChannel,
} from '@/lib/admission-payment-zod';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import {
  AlertTriangle,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  Layers,
  Library,
  Lock,
  Phone,
  User,
  Mail,
} from 'lucide-react';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-xs font-bold text-slate-500 mb-2 block';

function parseDateInput(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateInput(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ProfileDraft = {
  fullName: string;
  email: string;
  mobile: string;
  branchId: string;
  status: UserStatus;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  dob: string;
  bloodGroup: string;
  gender: string;
  address: string;
  instituteId: string;
  smsAlertTo: SmsAlertTo[];
};

const emptyProfile: ProfileDraft = {
  fullName: '',
  email: '',
  mobile: '',
  branchId: '',
  status: 'ACTIVE',
  fatherName: '',
  motherName: '',
  fatherMobile: '',
  motherMobile: '',
  dob: '',
  bloodGroup: '',
  gender: '',
  address: '',
  instituteId: '',
  smsAlertTo: [],
};

interface AddStudentWizardProps {
  branches: Branch[];
  institutes: Institute[];
  onSuccess: () => Promise<void>;
}

export function AddStudentWizard({ branches, institutes, onSuccess }: AddStudentWizardProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programCourses, setProgramCourses] = useState<Course[]>([]);
  const [programId, setProgramId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [enrollBranchId, setEnrollBranchId] = useState('');
  const [billingStartMonth, setBillingStartMonth] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  /** Overall amounts for all selected courses; split by course fee weight when creating invoices. */
  const [totalDiscountAmount, setTotalDiscountAmount] = useState('');
  const [totalScholarshipAmount, setTotalScholarshipAmount] = useState('');
  const [totalPaymentAmount, setTotalPaymentAmount] = useState('');
  const [discountReference, setDiscountReference] = useState('');
  const [admissionChannel, setAdmissionChannel] = useState<AdmissionPaymentChannel>('offline');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [done, setDone] = useState<{
    roll: string;
    oneTimePassword?: string;
    results: Array<{ courseName: string; pdfUrl: string | null; dueAmount: number; nextDue?: string }>;
  } | null>(null);

  useEffect(() => {
    getPrograms().then((res) => {
      if (res.success && res.data) setPrograms(res.data);
    });
  }, []);

  useEffect(() => {
    if (!programId) {
      setProgramCourses([]);
      setSelectedCourseIds([]);
      return;
    }
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await getProgramById(programId);
        if (res.success && res.data?.courses) {
          const list = res.data.courses as Course[];
          setProgramCourses(list);
          setSelectedCourseIds(list.map((c) => c.id));
        } else {
          setProgramCourses([]);
          setSelectedCourseIds([]);
        }
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [programId]);

  const courseById = useMemo(() => {
    const m = new Map<string, Course>();
    programCourses.forEach((c) => m.set(c.id, c));
    return m;
  }, [programCourses]);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAllCourses = () => {
    if (selectedCourseIds.length === programCourses.length) setSelectedCourseIds([]);
    else setSelectedCourseIds(programCourses.map((c) => c.id));
  };

  const totalCourseFee = useMemo(
    () => selectedCourseIds.reduce((s, id) => s + (Number(courseById.get(id)?.fee) || 0), 0),
    [selectedCourseIds, courseById],
  );

  const totalDiscountNum = Number(totalDiscountAmount) || 0;
  const totalScholarshipNum = Number(totalScholarshipAmount) || 0;
  const totalPaymentNum = Number(totalPaymentAmount) || 0;

  const netPayable = useMemo(
    () => netPayableAfterAdjustments(totalCourseFee, totalDiscountNum, totalScholarshipNum),
    [totalCourseFee, totalDiscountNum, totalScholarshipNum],
  );

  const balanceAfterPay = useMemo(
    () => Math.max(0, Math.round((netPayable - totalPaymentNum) * 100) / 100),
    [netPayable, totalPaymentNum],
  );

  const adjustmentsOverTotalFees =
    totalCourseFee > 0 && totalDiscountNum + totalScholarshipNum > totalCourseFee + 1e-6;

  const maxDiscountAllowed = Math.max(0, Math.round((totalCourseFee - totalScholarshipNum) * 100) / 100);
  const maxScholarshipAllowed = Math.max(0, Math.round((totalCourseFee - totalDiscountNum) * 100) / 100);

  const paymentFieldsLocked =
    admissionChannel === 'online' || (admissionChannel === 'offline' && adjustmentsOverTotalFees);

  useEffect(() => {
    if (admissionChannel !== 'offline') return;
    setTotalPaymentAmount((prev) => {
      const pay = Number(prev) || 0;
      if (pay > netPayable + 0.0001) return String(netPayable);
      return prev;
    });
  }, [admissionChannel, netPayable]);

  useEffect(() => {
    if (admissionChannel === 'online') {
      setTotalPaymentAmount('0');
      setPaymentMethod('GATEWAY');
      setPaymentTrxId('');
    }
  }, [admissionChannel]);

  const distributedPreview = useMemo(() => {
    const feeFn = (id: string) => Number(courseById.get(id)?.fee) || 0;
    const discMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalDiscountNum);
    const scholMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalScholarshipNum);
    const payMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalPaymentNum);
    const rows = selectedCourseIds.map((id) => {
      const fee = feeFn(id);
      const d = discMap[id] ?? 0;
      const sc = scholMap[id] ?? 0;
      const p = payMap[id] ?? 0;
      const payable = Math.max(fee - d - sc, 0);
      const due = Math.max(payable - p, 0);
      return { id, fee, disc: d, schol: sc, pay: p, payable, due };
    });
    return { rows };
  }, [selectedCourseIds, courseById, totalDiscountNum, totalScholarshipNum, totalPaymentNum]);

  const WIZARD_STEP_LABELS = ['Register', 'Courses', 'Payment', 'Confirm'] as const;

  const validateStep1 = (): boolean => {
    if (!profile.fullName.trim() || !profile.mobile.trim()) {
      setError('Name and mobile are required.');
      return false;
    }
    if (!/^01[3-9]\d{8}$/.test(profile.mobile.trim())) {
      setError('Mobile must be a valid 11-digit BD number (e.g. 017XXXXXXXX).');
      return false;
    }
    if (!profile.branchId) {
      setError('Select a branch.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!programId || selectedCourseIds.length === 0) {
      setError('Choose a program and at least one course.');
      return false;
    }
    const b = enrollBranchId || profile.branchId;
    if (!b) {
      setError('Select a branch for enrollment.');
      return false;
    }
    const needsMonth = selectedCourseIds.some((id) => courseById.get(id)?.billingType === 'MONTHLY');
    if (needsMonth && !/^\d{4}-\d{2}$/.test(billingStartMonth.trim())) {
      setError('Billing month (YYYY-MM) is required for monthly course(s).');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    const v = validateAdmissionPayment(totalCourseFee, admissionChannel, {
      totalDiscountAmount,
      totalScholarshipAmount,
      totalPaymentAmount,
      discountReference,
      paymentMethod,
      paymentTrxId,
    });
    if (v.ok === false) {
      setError(v.message);
      return false;
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2) {
      if (!validateStep2()) return;
      setEnrollBranchId((prev) => prev || profile.branchId);
      if (!billingStartMonth.trim()) {
        const needsMonth = selectedCourseIds.some((id) => courseById.get(id)?.billingType === 'MONTHLY');
        if (needsMonth) setBillingStartMonth(new Date().toISOString().slice(0, 7));
      }
      let sumOffer = 0;
      let offerNote = '';
      for (const id of selectedCourseIds) {
        const c = courseById.get(id);
        const o =
          c?.offerDiscountAmount != null && String(c.offerDiscountAmount) !== ''
            ? Number(c.offerDiscountAmount)
            : 0;
        sumOffer += o;
        if (o > 0 && c?.offerDiscountNote && !offerNote) offerNote = String(c.offerDiscountNote).trim();
      }
      const tf = selectedCourseIds.reduce((s, id) => s + (Number(courseById.get(id)?.fee) || 0), 0);
      setTotalDiscountAmount(sumOffer > 0 ? String(Math.round(sumOffer * 100) / 100) : '');
      setTotalScholarshipAmount('');
      setDiscountReference(offerNote);
      setTotalPaymentAmount(String(Math.round(Math.max(tf - sumOffer, 0) * 100) / 100));
    }
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    if (!validateStep3()) return;
    const branchForEnroll = enrollBranchId || profile.branchId;
    if (!branchForEnroll || selectedCourseIds.length === 0) {
      setError('Branch and at least one course are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const createRes = await createStudent({
        fullName: profile.fullName.trim(),
        email: profile.email.trim() || undefined,
        mobile: profile.mobile.trim(),
        branchId: profile.branchId || undefined,
        status: profile.status,
        fatherName: profile.fatherName.trim() || undefined,
        motherName: profile.motherName.trim() || undefined,
        fatherMobile: profile.fatherMobile.trim() || undefined,
        motherMobile: profile.motherMobile.trim() || undefined,
        dob: profile.dob || undefined,
        bloodGroup: profile.bloodGroup || undefined,
        gender: profile.gender || undefined,
        address: profile.address.trim() || undefined,
        instituteId: profile.instituteId || undefined,
        primaryMobile: profile.mobile.trim(),
        smsAlertTo: profile.smsAlertTo.length ? profile.smsAlertTo : undefined,
      });

      if (!createRes.success || !createRes.data?.id) {
        throw new Error(createRes.message || 'Failed to create student');
      }

      const studentUserId = createRes.data.id;
      const roll = createRes.data.studentProfile?.registrationNumber || '—';
      const otp = createRes.data.oneTimePassword;

      const monthYm = billingStartMonth.trim();
      const nextDueIso = nextPaymentDueDate
        ? new Date(`${nextPaymentDueDate}T12:00:00`).toISOString()
        : undefined;

      const results: Array<{ courseName: string; pdfUrl: string | null; dueAmount: number; nextDue?: string }> = [];

      const feeFn = (id: string) => Number(courseById.get(id)?.fee) || 0;
      const discMap = distributeProportionalByFee(selectedCourseIds, feeFn, Number(totalDiscountAmount) || 0);
      const scholMap = distributeProportionalByFee(selectedCourseIds, feeFn, Number(totalScholarshipAmount) || 0);
      const payMap = distributeProportionalByFee(selectedCourseIds, feeFn, Number(totalPaymentAmount) || 0);
      const refTrim = discountReference.trim();

      for (const courseId of selectedCourseIds) {
        const c = courseById.get(courseId);
        const disc = discMap[courseId] ?? 0;
        const schol = scholMap[courseId] ?? 0;
        const paid = payMap[courseId] ?? 0;

        const adm = await offlineAdmission({
          studentUserId,
          courseId,
          branchId: branchForEnroll,
          billingStartMonth: c?.billingType === 'MONTHLY' ? monthYm || undefined : undefined,
          paymentMethod,
          paymentAmount: paid,
          paymentTrxId: paid > 0 && paymentMethod !== 'CASH' ? paymentTrxId.trim() || undefined : undefined,
          discountAmount: disc > 0 ? disc : undefined,
          discountReference: disc > 0 ? refTrim : undefined,
          scholarshipAmount: schol > 0 ? schol : undefined,
          nextPaymentDueDate: nextDueIso,
        });

        if (!adm.success || !adm.data) {
          throw new Error(adm.message || `Admission failed for ${c?.name || courseId}`);
        }

        const dueNum = Number(adm.data.invoice.dueAmount);
        const nextDueRaw = adm.data.invoice.nextPaymentDueDate;
        const nextDueStr = nextDueRaw
          ? format(new Date(nextDueRaw), 'dd MMM yyyy')
          : nextPaymentDueDate
            ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy')
            : undefined;

        results.push({
          courseName: c?.name || 'Course',
          pdfUrl: adm.data.pdfUrl,
          dueAmount: Number.isFinite(dueNum) ? dueNum : 0,
          nextDue: nextDueStr,
        });
      }

      setDone({ roll, oneTimePassword: otp, results });

      toast({
        title: 'Admission complete',
        description: `${results.length} course(s) enrolled with invoice(s).`,
        variant: 'success',
      });
      await onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col h-full max-h-[85vh] bg-white text-slate-900">
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Admission complete</h3>
            <p className="text-sm text-slate-600">
              Save roll and one-time password. Student logs in with mobile + password. Invoice PDFs are generated for each course.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Roll / Reg. no.</p>
                <p className="font-mono text-xl font-black text-slate-900">{done.roll}</p>
              </div>
              {done.oneTimePassword ? (
                <div className="rounded-2xl bg-white border border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    One-time password
                  </p>
                  <p className="font-mono text-xl font-black text-indigo-700">{done.oneTimePassword}</p>
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoices by course</p>
              {done.results.map((r, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                  <p className="text-sm font-black text-slate-800">{r.courseName}</p>
                  <p className="text-lg font-black text-amber-800">Due: {r.dueAmount.toFixed(2)} BDT</p>
                  {r.nextDue ? <p className="text-xs font-bold text-slate-600">Next payment: {r.nextDue}</p> : null}
                  {r.pdfUrl ? (
                    <Button className="h-10 rounded-xl bg-slate-900 font-black uppercase text-[10px] text-white" asChild>
                      <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Invoice PDF
                      </a>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-slate-100 px-8 pb-8 pt-6">
          <Button
            className="w-full h-14 rounded-2xl bg-indigo-600 font-black uppercase tracking-[0.2em] text-[11px] text-white"
            onClick={closeModal}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-white text-slate-900">
      <div className="border-b border-slate-100 px-4 pt-6 pb-4 sm:px-8">
        <div className="mb-1 grid w-full grid-cols-4 gap-1 sm:gap-2">
          {WIZARD_STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex flex-col items-center px-0.5 text-center">
                <div
                  className={cn(
                    'mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold sm:h-9 sm:w-9 sm:text-xs',
                    done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : n}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold leading-tight sm:text-[11px]',
                    active ? 'text-indigo-700' : 'text-slate-500',
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar space-y-8">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Account & branch</h3>
                <p className="text-xs text-slate-400">Roll and password are created automatically on submit (step 3).</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>Full name</label>
                <Input
                  className={inputClass}
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Student name"
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Mobile (login)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    value={profile.mobile}
                    onChange={(e) => setProfile((p) => ({ ...p, mobile: e.target.value }))}
                    placeholder="017XXXXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Branch</label>
                <Select value={profile.branchId} onValueChange={(v) => setProfile((p) => ({ ...p, branchId: v }))}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Status</label>
                <Select
                  value={profile.status}
                  onValueChange={(v) => setProfile((p) => ({ ...p, status: v as UserStatus }))}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Institute (optional)</label>
                <InstituteCombobox
                  institutes={institutes}
                  value={profile.instituteId}
                  onSelect={(v) => setProfile((p) => ({ ...p, instituteId: v }))}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 space-y-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-slate-400" />
                <h4 className="text-sm font-black text-slate-700">Optional — guardians</h4>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Father name</label>
                  <Input
                    className={inputClass}
                    value={profile.fatherName}
                    onChange={(e) => setProfile((p) => ({ ...p, fatherName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother name</label>
                  <Input
                    className={inputClass}
                    value={profile.motherName}
                    onChange={(e) => setProfile((p) => ({ ...p, motherName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Father mobile</label>
                  <Input
                    className={inputClass}
                    value={profile.fatherMobile}
                    onChange={(e) => setProfile((p) => ({ ...p, fatherMobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother mobile</label>
                  <Input
                    className={inputClass}
                    value={profile.motherMobile}
                    onChange={(e) => setProfile((p) => ({ ...p, motherMobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Date of birth</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 font-bold',
                          !profile.dob && 'text-slate-400',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {profile.dob ? format(parseDateInput(profile.dob)!, 'dd-MM-yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar
                        selected={parseDateInput(profile.dob)}
                        onSelect={(date) => setProfile((p) => ({ ...p, dob: formatDateInput(date) }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Gender</label>
                  <Select value={profile.gender} onValueChange={(v) => setProfile((p) => ({ ...p, gender: v }))}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="MALE">MALE</SelectItem>
                      <SelectItem value="FEMALE">FEMALE</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Address</label>
                  <textarea
                    className="w-full min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold"
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>SMS alerts</label>
                  <div className="flex flex-wrap gap-6">
                    {(['SELF', 'FATHER', 'MOTHER'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                        <Checkbox
                          checked={profile.smsAlertTo.includes(opt)}
                          onCheckedChange={(checked) =>
                            setProfile((p) => ({
                              ...p,
                              smsAlertTo: checked
                                ? [...p.smsAlertTo, opt]
                                : p.smsAlertTo.filter((x) => x !== opt),
                            }))
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Library className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Choose courses</h3>
                <p className="text-xs text-slate-500">
                  Pick one or more courses from the program. Each row shows <strong>Offline</strong> (in-person / center) or{' '}
                  <strong>Online</strong> (remote / portal) — that is how the course is delivered, not how payment is collected.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Program</label>
              {programs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-sm font-semibold text-amber-900">
                  No programs loaded. Check your connection or create a program first.
                </p>
              ) : (
                <Select
                  value={programId || undefined}
                  onValueChange={(v) => setProgramId(v)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                    <SelectValue placeholder="Choose a program…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {!programId ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Select a program above to list its courses for this admission.
              </div>
            ) : loadingCourses ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : programCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
                This program has no courses attached yet.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase" onClick={toggleAllCourses}>
                    {selectedCourseIds.length === programCourses.length ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                {programCourses.map((c) => {
                  const sel = selectedCourseIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCourse(c.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all',
                        sel ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={sel} className="pointer-events-none" />
                        <Layers className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-800">{c.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <CourseDeliveryBadge type={c.type} />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {c.code} · {Number(c.fee).toFixed(0)} BDT ·{' '}
                              {c.billingType === 'MONTHLY' ? 'MONTHLY' : 'ONE-TIME'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {sel ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid gap-6 border-t border-slate-100 pt-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>Enrollment branch</label>
                <Select
                  value={(enrollBranchId || profile.branchId) || undefined}
                  onValueChange={setEnrollBranchId}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm">
                    <SelectValue placeholder="Branch for these enrollments" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] font-medium text-slate-400">Defaults to the student branch from step 1; change if needed.</p>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>First billing month (monthly courses)</label>
                <MonthYearPicker
                  value={billingStartMonth}
                  onChange={setBillingStartMonth}
                  placeholder="Select month"
                />
                <p className="text-[10px] text-slate-400 font-bold">Required when any selected course is monthly.</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Payment & adjustments</h3>
                <p className="text-xs text-slate-500">
                  Totals apply to all selected courses and are split by fee weight. Discount + scholarship cannot exceed fees; pay
                  today cannot exceed net payable. Invoice PDFs are generated right after admission.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className={sectionLabel}>Payment timing (not course delivery type)</label>
              <p className="mb-2 text-[11px] font-medium text-slate-500">
                This is whether you record money <strong>now</strong> or the student pays <strong>later</strong> via gateway. It is
                separate from each course&apos;s <strong>Online / Offline</strong> delivery label in the previous step.
              </p>
              <Select
                value={admissionChannel}
                onValueChange={(v) => setAdmissionChannel(v as AdmissionPaymentChannel)}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="offline">Collect payment now (cash / bKash / bank)</SelectItem>
                  <SelectItem value="online">Pay later — invoice only for now (gateway later)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-slate-500">
                {admissionChannel === 'online'
                  ? 'Payment fields below stay off. Invoice PDF is still created; the student pays from their account later.'
                  : 'Enter what you collect today. Transaction ID is required for non-cash.'}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Totals (auto)</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Total course fees</dt>
                  <dd className="font-mono">{totalCourseFee.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Net after discount & scholarship</dt>
                  <dd className="font-mono text-indigo-800">{netPayable.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-slate-800">
                  <dt>Pay today (total)</dt>
                  <dd className="font-mono">{totalPaymentNum.toFixed(2)} BDT</dd>
                </div>
                <div className="flex justify-between gap-2 font-bold text-amber-900">
                  <dt>Balance after pay today</dt>
                  <dd className="font-mono">{balanceAfterPay.toFixed(2)} BDT</dd>
                </div>
              </dl>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[320px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Course</th>
                    <th className="px-3 py-2 text-right">Fee (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCourseIds.map((cid) => {
                    const c = courseById.get(cid);
                    const fee = c?.fee != null ? Number(c.fee) : 0;
                    return (
                      <tr key={cid}>
                        <td className="px-3 py-2 font-bold text-slate-800">{c?.name}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">{fee.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
                  <tr>
                    <td className="px-3 py-2 text-xs font-black uppercase text-slate-600">Total</td>
                    <td className="px-3 py-2 text-right font-black text-slate-900">{totalCourseFee.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Discount & scholarship</p>
              <p className="mb-3 text-xs text-slate-600">Together these cannot exceed total course fees ({totalCourseFee.toFixed(2)} BDT).</p>
              {adjustmentsOverTotalFees ? (
                <div className="mb-3 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Discount + scholarship ({(totalDiscountNum + totalScholarshipNum).toFixed(2)} BDT) exceed fees. Lower one or both.
                    Max discount now: {maxDiscountAllowed.toFixed(2)} · Max scholarship now: {maxScholarshipAllowed.toFixed(2)}
                  </span>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Total discount (BDT)</label>
                  <Input
                    className={cn(
                      inputClass,
                      adjustmentsOverTotalFees ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-500/15' : '',
                    )}
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalDiscountAmount}
                    onChange={(e) => setTotalDiscountAmount(e.target.value)}
                  />
                  <p className="text-[10px] font-medium text-slate-400">Cap with current scholarship: {maxDiscountAllowed.toFixed(2)} BDT</p>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Total scholarship (BDT)</label>
                  <Input
                    className={cn(
                      inputClass,
                      adjustmentsOverTotalFees ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-500/15' : '',
                    )}
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalScholarshipAmount}
                    onChange={(e) => setTotalScholarshipAmount(e.target.value)}
                  />
                  <p className="text-[10px] font-medium text-slate-400">Cap with current discount: {maxScholarshipAllowed.toFixed(2)} BDT</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Discount reference (required if discount &gt; 0)</label>
                  <Input
                    className={inputClass}
                    value={discountReference}
                    onChange={(e) => setDiscountReference(e.target.value)}
                    placeholder="Offer code, approver…"
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                'rounded-2xl border-2 p-4 transition-colors',
                paymentFieldsLocked
                  ? 'border-slate-200 bg-slate-100/80'
                  : 'border-emerald-200/80 bg-emerald-50/30',
              )}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Payment collected today</p>
                  <p className="text-xs font-semibold text-slate-700">Only active for offline collection when discount + scholarship are valid.</p>
                </div>
                {paymentFieldsLocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
                    <Lock className="h-3 w-3" />
                    {admissionChannel === 'online' ? 'Pay later' : 'Fix adjustments'}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className={cn(sectionLabel, paymentFieldsLocked && 'text-slate-400')}>Total pay today (BDT)</label>
                  <Input
                    className={cn(inputClass, paymentFieldsLocked && 'cursor-not-allowed bg-slate-100 text-slate-500')}
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalPaymentAmount}
                    onChange={(e) => setTotalPaymentAmount(e.target.value)}
                    disabled={paymentFieldsLocked}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={cn(sectionLabel, paymentFieldsLocked && 'text-slate-400')}>Payment method</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}
                    disabled={paymentFieldsLocked}
                  >
                    <SelectTrigger
                      className={cn(
                        'h-12 rounded-2xl border-slate-200 font-bold',
                        paymentFieldsLocked ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'bg-white',
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BKASH">bKash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="GATEWAY">Gateway / online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={cn(sectionLabel, paymentFieldsLocked && 'text-slate-400')}>
                    Transaction / slip reference (non-cash, if paying now)
                  </label>
                  <Input
                    className={cn(inputClass, paymentFieldsLocked && 'cursor-not-allowed bg-slate-100 text-slate-500')}
                    value={paymentTrxId}
                    onChange={(e) => setPaymentTrxId(e.target.value)}
                    placeholder="Trx ID, bank ref…"
                    disabled={paymentFieldsLocked}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Next payment date (all invoices)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-12 w-full justify-start rounded-2xl border-slate-200 bg-white font-bold shadow-sm',
                          !nextPaymentDueDate && 'text-slate-400',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nextPaymentDueDate
                          ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy')
                          : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                      <Calendar
                        selected={parseDateInput(nextPaymentDueDate)}
                        onSelect={(date) => setNextPaymentDueDate(formatDateInput(date))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
              <div className="border-b border-indigo-100 bg-indigo-600 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Per-course split (preview)</p>
                <p className="text-xs font-medium text-indigo-100">Amounts scaled by each course fee; same totals as above.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2 text-right">Fee</th>
                      <th className="px-3 py-2 text-right">Disc</th>
                      <th className="px-3 py-2 text-right">Schol.</th>
                      <th className="px-3 py-2 text-right">Pay</th>
                      <th className="px-3 py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {distributedPreview.rows.map((r) => (
                      <tr key={r.id} className="bg-white">
                        <td className="max-w-[200px] truncate px-3 py-2.5 font-bold text-slate-800" title={courseById.get(r.id)?.name}>
                          {courseById.get(r.id)?.name}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{r.fee.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-amber-800">{r.disc.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-violet-800">{r.schol.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-800">{r.pay.toFixed(0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-black text-rose-700">{r.due.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-800">Final review</h3>
              <p className="mt-2 text-xs font-bold text-slate-600">
                If the table looks correct, press Create student & invoices. Invoice PDFs generate immediately after save.
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Course</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                    <th className="px-3 py-2 text-right">Disc.</th>
                    <th className="px-3 py-2 text-right">Schol.</th>
                    <th className="px-3 py-2 text-right">Pay now</th>
                    <th className="px-3 py-2 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {distributedPreview.rows.map((r) => {
                    const c = courseById.get(r.id);
                    return (
                      <tr key={r.id} className="bg-white">
                        <td className="px-3 py-2 font-bold text-slate-800">{c?.name}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.fee.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.disc.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.schol.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.pay.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-black text-amber-800">{r.due.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs font-bold text-slate-600 space-y-1">
              <p>Branch: {branches.find((b) => b.id === (enrollBranchId || profile.branchId))?.name}</p>
              <p>Billing month: {billingStartMonth || '—'}</p>
              <p>
                Payment timing:{' '}
                {admissionChannel === 'offline' ? 'Collect now (cash / bKash / bank)' : 'Pay later (gateway)'}
              </p>
              <p>Payment method: {paymentMethod}</p>
              <p>Next payment: {nextPaymentDueDate ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy') : '—'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-black uppercase tracking-widest text-rose-600">
            {error}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-8 pb-8 pt-6 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="h-14 rounded-2xl flex-1 font-black uppercase tracking-widest text-[11px] bg-slate-700 text-white border-slate-700 hover:bg-slate-800 hover:text-white"
          onClick={step === 1 ? closeModal : goBack}
        >
          {step === 1 ? (
            'Cancel'
          ) : (
            <>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </>
          )}
        </Button>
        {step < 4 ? (
          <Button
            className="h-14 flex-[2] rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white hover:bg-slate-900 hover:text-white"
            onClick={goNext}
            disabled={step === 3 && adjustmentsOverTotalFees}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="h-14 flex-[2] rounded-2xl bg-indigo-600 font-black uppercase tracking-widest text-[11px] text-white hover:bg-indigo-600 hover:text-white"
            onClick={handleFinish}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Create student & invoices'}
          </Button>
        )}
      </div>
    </div>
  );
}
