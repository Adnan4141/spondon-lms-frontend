'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  Layers,
  Library,
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
  const [courseId, setCourseId] = useState('');
  const [enrollBranchId, setEnrollBranchId] = useState('');
  const [billingStartMonth, setBillingStartMonth] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [discountAmount, setDiscountAmount] = useState('');
  const [scholarshipAmount, setScholarshipAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [done, setDone] = useState<{
    roll: string;
    oneTimePassword?: string;
    pdfUrl: string | null;
    dueAmount: number;
    nextDue?: string;
    courseName: string;
  } | null>(null);

  useEffect(() => {
    getPrograms().then((res) => {
      if (res.success && res.data) setPrograms(res.data);
    });
  }, []);

  useEffect(() => {
    if (!programId) {
      setProgramCourses([]);
      setCourseId('');
      return;
    }
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await getProgramById(programId);
        if (res.success && res.data?.courses) {
          setProgramCourses(res.data.courses as Course[]);
          const first = (res.data.courses as Course[])[0];
          setCourseId(first?.id || '');
        }
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [programId]);

  const selectedCourse = useMemo(
    () => programCourses.find((c) => c.id === courseId),
    [programCourses, courseId],
  );

  const courseFee = selectedCourse?.fee != null ? Number(selectedCourse.fee) : 0;
  const disc = Number(discountAmount) || 0;
  const schol = Number(scholarshipAmount) || 0;
  const paid = Number(paymentAmount) || 0;
  const payable = Math.max(courseFee - disc - schol, 0);
  const duePreview = Math.max(payable - paid, 0);

  const primedStep3Payment = useRef(false);
  useEffect(() => {
    if (step !== 3) {
      primedStep3Payment.current = false;
      return;
    }
    if (primedStep3Payment.current || !courseId) return;
    primedStep3Payment.current = true;
    setPaymentAmount(String(Math.max(courseFee - disc - schol, 0)));
  }, [step, courseId, courseFee, disc, schol]);

  const stepTitles = ['Student profile', 'Course & branch', 'Payment, due & invoice'];

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
    if (!programId || !courseId) {
      setError('Choose a program and a course.');
      return false;
    }
    const b = enrollBranchId || profile.branchId;
    if (!b) {
      setError('Select a branch for enrollment.');
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
      if (selectedCourse?.billingType === 'MONTHLY' && !billingStartMonth.trim()) {
        setBillingStartMonth(new Date().toISOString().slice(0, 7));
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    const branchForEnroll = enrollBranchId || profile.branchId;
    if (!branchForEnroll || !courseId) {
      setError('Branch and course are required.');
      return;
    }
    if (Number.isNaN(paid) || paid < 0) {
      setError('Payment amount must be zero or positive.');
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

      const adm = await offlineAdmission({
        studentUserId,
        courseId,
        branchId: branchForEnroll,
        billingStartMonth: billingStartMonth.trim() || undefined,
        paymentMethod,
        paymentAmount: paid,
        paymentTrxId: paymentTrxId.trim() || undefined,
        discountAmount: disc || undefined,
        scholarshipAmount: schol || undefined,
        nextPaymentDueDate: nextPaymentDueDate
          ? new Date(`${nextPaymentDueDate}T12:00:00`).toISOString()
          : undefined,
      });

      if (!adm.success || !adm.data) {
        throw new Error(
          adm.message ||
            'Student was created but admission failed. Complete enrollment from the student record.',
        );
      }

      const dueNum = Number(adm.data.invoice.dueAmount);
      const nextDueRaw = adm.data.invoice.nextPaymentDueDate;
      const nextDueStr = nextDueRaw
        ? format(new Date(nextDueRaw), 'dd MMM yyyy')
        : nextPaymentDueDate
          ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy')
          : undefined;

      setDone({
        roll,
        oneTimePassword: otp,
        pdfUrl: adm.data.pdfUrl,
        dueAmount: Number.isFinite(dueNum) ? dueNum : duePreview,
        nextDue: nextDueStr,
        courseName: selectedCourse?.name || 'Course',
      });

      toast({
        title: 'Admission complete',
        description: 'Student account, enrollment, and invoice are ready.',
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
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Done</h3>
            <p className="text-sm text-slate-600">
              Save roll number and the one-time password for the student. They log in with mobile + this password.
            </p>
            <p className="text-xs font-bold text-slate-500">Course: {done.courseName}</p>
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
            <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding due</p>
              <p className="text-2xl font-black text-slate-900">{done.dueAmount.toFixed(2)} BDT</p>
              {done.nextDue ? (
                <p className="text-sm font-bold text-slate-600">Next payment: {done.nextDue}</p>
              ) : null}
            </div>
            {done.pdfUrl ? (
              <Button
                className="w-full h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[11px]"
                asChild
              >
                <a href={done.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Open invoice PDF
                </a>
              </Button>
            ) : null}
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
      <div className="px-8 pt-6 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center flex-1 gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-black',
                  step >= n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400',
                )}
              >
                {n}
              </div>
              {n < 3 && <div className={cn('h-1 flex-1 rounded-full', step > n ? 'bg-indigo-400' : 'bg-slate-100')} />}
            </div>
          ))}
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 pb-4">
          {stepTitles[step - 1]}
        </p>
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
                <h3 className="text-base font-black text-slate-800">Program & course</h3>
                <p className="text-xs text-slate-400">Pick one course for this offline admission invoice.</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Program</label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {loadingCourses ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {programCourses.map((c) => {
                  const sel = courseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCourseId(c.id)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-2xl border p-4 text-left transition-all',
                        sel ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-800">{c.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {c.code} · {Number(c.fee).toFixed(0)} BDT
                          </p>
                        </div>
                      </div>
                      {sel ? (
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2 border-t border-slate-100 pt-8">
              <div className="space-y-2">
                <label className={sectionLabel}>Enrollment branch</label>
                <Select
                  value={enrollBranchId || profile.branchId || ''}
                  onValueChange={setEnrollBranchId}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue placeholder="Branch" />
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
                <label className={sectionLabel}>Billing month (YYYY-MM)</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    value={billingStartMonth}
                    onChange={(e) => setBillingStartMonth(e.target.value)}
                    placeholder="2026-03"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold">Used for monthly courses; optional for one-time.</p>
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
                <h3 className="text-base font-black text-slate-800">Offline payment & invoice</h3>
                <p className="text-xs text-slate-400">
                  {selectedCourse?.name} — fee {courseFee.toFixed(2)} BDT
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>Discount (BDT)</label>
                <Input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Scholarship (BDT)</label>
                <Input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={scholarshipAmount}
                  onChange={(e) => setScholarshipAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Paying now (BDT)</label>
                <Input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>Method</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="BKASH">BKASH</SelectItem>
                    <SelectItem value="BANK">BANK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Transaction ID (optional)</label>
                <Input
                  className={inputClass}
                  value={paymentTrxId}
                  onChange={(e) => setPaymentTrxId(e.target.value)}
                  placeholder="Bkash trx id, slip ref, etc."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>Next payment date (optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 font-bold',
                        !nextPaymentDueDate && 'text-slate-400',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextPaymentDueDate
                        ? format(parseDateInput(nextPaymentDueDate)!, 'dd MMM yyyy')
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                      selected={parseDateInput(nextPaymentDueDate)}
                      onSelect={(date) => setNextPaymentDueDate(formatDateInput(date))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 space-y-2 text-sm font-bold text-slate-700">
              <p>Payable: {payable.toFixed(2)} BDT</p>
              <p className="text-indigo-700">Due after this payment: {duePreview.toFixed(2)} BDT</p>
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
          className="h-14 rounded-2xl flex-1 font-black uppercase tracking-widest text-[11px]"
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
        {step < 3 ? (
          <Button
            className="h-14 rounded-2xl flex-[2] bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white"
            onClick={goNext}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="h-14 rounded-2xl flex-[2] bg-indigo-600 font-black uppercase tracking-widest text-[11px] text-white"
            onClick={handleFinish}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Create student & invoice'}
          </Button>
        )}
      </div>
    </div>
  );
}
