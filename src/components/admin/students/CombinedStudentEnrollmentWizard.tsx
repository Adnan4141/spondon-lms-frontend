'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { createStudent, checkDuplicateMobile, sendCredentialsSms, sendCredentialsEmail } from '@/lib/api/students';
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
import { EnrollmentForm } from '@/components/admin/students/EnrollmentForm';
import {
  CalendarIcon,
  Check,
  ChevronRight,
  Copy,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  User,
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

interface CombinedStudentEnrollmentWizardProps {
  branches: Branch[];
  institutes: Institute[];
  onSuccess: () => Promise<void>;
}

const WIZARD_STEP_LABELS = ['Profile', 'Courses', 'Payment', 'Confirm'] as const;

export function CombinedStudentEnrollmentWizard({ branches, institutes, onSuccess }: CombinedStudentEnrollmentWizardProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After student creation
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [done, setDone] = useState<{
    studentId: string;
    roll: string;
    oneTimePassword?: string | null;
    email?: string;
  } | null>(null);

  // Mobile duplicate check
  const [mobileCheckState, setMobileCheckState] = useState<'idle' | 'checking' | 'exists' | 'clear'>('idle');
  const [existingStudent, setExistingStudent] = useState<{ id: string; fullName: string; registrationNumber: string | null } | null>(null);
  const [mobileDuplicateDismissed, setMobileDuplicateDismissed] = useState(false);
  const mobileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced mobile duplicate check
  useEffect(() => {
    const mobile = profile.mobile.trim();
    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      setMobileCheckState('idle');
      setExistingStudent(null);
      return;
    }
    setMobileCheckState('checking');
    if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current);
    mobileDebounceRef.current = setTimeout(async () => {
      try {
        const res = await checkDuplicateMobile(mobile);
        if (res.success && res.data?.exists) {
          setMobileCheckState('exists');
          setExistingStudent(res.data.student ?? null);
          setMobileDuplicateDismissed(false);
        } else {
          setMobileCheckState('clear');
          setExistingStudent(null);
        }
      } catch {
        setMobileCheckState('idle');
      }
    }, 500);
    return () => {
      if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.mobile]);

  const validateProfile = (): boolean => {
    if (!profile.fullName.trim() || !profile.mobile.trim()) {
      setError('Name and mobile are required.');
      return false;
    }
    if (!/^01[3-9]\d{8}$/.test(profile.mobile.trim())) {
      setError('Mobile must be a valid 11-digit BD number (e.g. 017XXXXXXXX).');
      return false;
    }
    if (mobileCheckState === 'exists' && !mobileDuplicateDismissed) {
      setError('এই নম্বরে আগে থেকে একজন Student আছেন। তবুও নতুন করতে চাইলে "তবুও নতুন করুন"-এ ক্লিক করুন।');
      return false;
    }
    if (!profile.branchId) {
      setError('Select a branch.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleProfileNext = async () => {
    if (!validateProfile()) return;
    try {
      setSubmittingProfile(true);
      setError(null);
      const res = await createStudent({
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
      if (!res.success || !res.data?.id) throw new Error(res.message || 'Failed to create student');
      setCreatedStudentId(res.data.id);
      setDone({
        studentId: res.data.id,
        roll: res.data.studentProfile?.registrationNumber ?? '—',
        oneTimePassword: res.data.oneTimePassword,
        email: profile.email.trim() || undefined,
      });
      setStep(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleEnrollSuccess = async () => {
    await onSuccess();
    // Move to a simple "done" screen by using step 5 as sentinel
    setStep(5);
  };

  // ─── Done screen ─────────────────────────────────────────────────────────────
  if (step === 5 && done) {
    return (
      <div className="flex flex-col h-full max-h-[85vh] bg-white text-slate-900">
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">ভর্তি সম্পন্ন</h3>
            <p className="text-sm text-slate-600">
              রেজিস্ট্রেশন নম্বর ও পাসওয়ার্ড সংরক্ষণ করুন। Student মোবাইল + পাসওয়ার্ড দিয়ে লগইন করবে।
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">রেজিস্ট্রেশন নম্বর</p>
                <p className="font-mono text-xl font-black text-slate-900">{done.roll}</p>
              </div>
              {done.oneTimePassword && (
                <div className="rounded-2xl bg-white border border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">প্রাথমিক পাসওয়ার্ড</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xl font-black text-indigo-700 flex-1">{done.oneTimePassword}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(done.oneTimePassword!);
                        toast({ title: 'Copied', description: 'Password copied to clipboard', variant: 'success' });
                      }}
                      className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold"
                onClick={async () => {
                  try {
                    await sendCredentialsSms(done.studentId);
                    toast({ title: 'SMS পাঠানো হয়েছে', variant: 'success' });
                  } catch (e: unknown) {
                    toast({ title: 'Error', description: e instanceof Error ? e.message : 'SMS failed', variant: 'destructive' });
                  }
                }}
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                SMS পাঠান
              </Button>
              {done.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                  onClick={async () => {
                    try {
                      await sendCredentialsEmail(done.studentId);
                      toast({ title: 'Email পাঠানো হয়েছে', variant: 'success' });
                    } catch (e: unknown) {
                      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Email failed', variant: 'destructive' });
                    }
                  }}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Email পাঠান
                </Button>
              )}
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
      {/* Step indicator */}
      <div className="border-b border-slate-100 px-4 pt-6 pb-4 sm:px-8">
        <div className="mb-1 grid w-full grid-cols-4 gap-1 sm:gap-2">
          {WIZARD_STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const isDone = step > n;
            return (
              <div key={label} className="flex flex-col items-center px-0.5 text-center">
                <div
                  className={cn(
                    'mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold sm:h-9 sm:w-9 sm:text-xs',
                    isDone ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : n}
                </div>
                <span className={cn('text-[10px] font-semibold leading-tight sm:text-[11px]', active ? 'text-indigo-700' : 'text-slate-500')}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 1: Profile ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Account & branch</h3>
                <p className="text-xs text-slate-400">Roll and password are created automatically when you click Next.</p>
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
                    className={cn(inputClass, 'pl-11',
                      mobileCheckState === 'exists' && !mobileDuplicateDismissed ? 'border-amber-400 bg-amber-50' :
                      mobileCheckState === 'clear' ? 'border-emerald-400' : ''
                    )}
                    value={profile.mobile}
                    onChange={(e) => setProfile((p) => ({ ...p, mobile: e.target.value }))}
                    placeholder="017XXXXXXXX"
                  />
                  {mobileCheckState === 'checking' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  )}
                  {mobileCheckState === 'clear' && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {mobileCheckState === 'exists' && !mobileDuplicateDismissed && existingStudent && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                    <p className="text-xs font-bold text-amber-800">
                      ⚠ এই নম্বরে আগে থেকে একজন Student আছেন: <strong>{existingStudent.fullName}</strong>
                      {existingStudent.registrationNumber ? ` (রেজি. ${existingStudent.registrationNumber})` : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-[11px] h-7 border-amber-300 text-amber-800 hover:bg-amber-100"
                        onClick={() => window.open(`/admin/students/${existingStudent!.id}`, '_blank')}
                      >
                        বিদ্যমান Student দেখুন
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg text-[11px] h-7 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => setMobileDuplicateDismissed(true)}
                      >
                        তবুও নতুন করুন
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>ইমেইল (ঐচ্ছিক)</label>
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
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className={sectionLabel}>Status</label>
                <Select value={profile.status} onValueChange={(v) => setProfile((p) => ({ ...p, status: v as UserStatus }))}>
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
                <h4 className="text-sm font-black text-slate-700">Optional — guardians & details</h4>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Father name</label>
                  <Input className={inputClass} value={profile.fatherName} onChange={(e) => setProfile((p) => ({ ...p, fatherName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother name</label>
                  <Input className={inputClass} value={profile.motherName} onChange={(e) => setProfile((p) => ({ ...p, motherName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Father mobile</label>
                  <Input className={inputClass} value={profile.fatherMobile} onChange={(e) => setProfile((p) => ({ ...p, fatherMobile: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother mobile</label>
                  <Input className={inputClass} value={profile.motherMobile} onChange={(e) => setProfile((p) => ({ ...p, motherMobile: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Date of birth</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 font-bold', !profile.dob && 'text-slate-400')}
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
                    className="w-full min-h-22 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold"
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
                              smsAlertTo: checked ? [...p.smsAlertTo, opt] : p.smsAlertTo.filter((x) => x !== opt),
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

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Steps 2–4: Enrollment (via EnrollmentForm) ────────────────────── */}
      {step >= 2 && step <= 4 && createdStudentId && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <EnrollmentForm
            studentId={createdStudentId}
            defaultBranchId={profile.branchId}
            onSuccess={handleEnrollSuccess}
            nestedInParentWizard={{
              parentStep: step,
              setParentStep: setStep,
              onBackToProfile: () => setStep(1),
            }}
          />
        </div>
      )}

      {/* ── Footer (step 1 only) ────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="shrink-0 border-t border-slate-100 px-8 py-5 flex items-center justify-end gap-3">
          <Button
            type="button"
            className="gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12"
            onClick={handleProfileNext}
            disabled={submittingProfile}
          >
            {submittingProfile ? 'Creating student…' : 'Next'}
            {!submittingProfile && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
