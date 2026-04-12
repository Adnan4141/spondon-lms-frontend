'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getStudentById, updateStudent } from '@/lib/api/students';
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InstituteCombobox } from '@/components/admin/students/StudentForm';
import { AddEnrollmentForm } from '@/components/admin/students/AddEnrollmentForm';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Branch, Institute, SmsAlertTo, Student, UserStatus } from '@/types/student';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-xs font-bold text-slate-500 mb-2 block';

function parseDateInput(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatDateInput(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WIZARD_STEP_LABELS = ['Update profile', 'Courses', 'Payment', 'Confirm'] as const;

interface EditStudentWizardProps {
  student: Student;
  branches: Branch[];
  institutes: Institute[];
  onSuccess: () => Promise<void>;
}

type FormState = {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
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
  sscInfo: any;
  hscInfo: any;
};

function buildForm(s: Student): FormState {
  const p = s.studentProfile;
  return {
    fullName: s.fullName,
    email: s.email || '',
    mobile: s.mobile,
    password: '',
    branchId: s.branchId || '',
    status: s.status as UserStatus,
    fatherName: p?.fatherName || '',
    motherName: p?.motherName || '',
    fatherMobile: p?.fatherMobile || '',
    motherMobile: p?.motherMobile || '',
    dob: p?.dob || '',
    bloodGroup: p?.bloodGroup || '',
    gender: p?.gender || '',
    address: p?.address || '',
    instituteId: p?.instituteId || '',
    smsAlertTo: (p?.smsAlertTo as SmsAlertTo[] | undefined) || [],
    sscInfo: p?.sscInfo,
    hscInfo: p?.hscInfo,
  };
}

export function EditStudentWizard({ student, branches, institutes, onSuccess }: EditStudentWizardProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => buildForm(student));
  const [studentRecord, setStudentRecord] = useState(student);
  const [enrollmentBranchId, setEnrollmentBranchId] = useState(student.branchId || '');

  // Reset form when student prop changes
  useEffect(() => {
    setForm(buildForm(student));
    setStudentRecord(student);
    setEnrollmentBranchId(student.branchId || '');
  }, [student]);

  const set = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));

  const handleSaveAndNext = async () => {
    if (!form.fullName.trim() || !form.mobile.trim()) {
      setError('Name and mobile are required.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const { password, ...rest } = form;
      await updateStudent(student.id, {
        ...rest,
        password: password?.trim() ? password : undefined,
      });
      toast({ title: 'Profile updated', variant: 'success' });
      setEnrollmentBranchId(form.branchId || studentRecord.branchId || '');
      try {
        const fr = await getStudentById(student.id);
        if (fr.success && fr.data) setStudentRecord(fr.data);
      } catch {
        /* keep current record */
      }
      setStep(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollSuccess = async () => {
    await onSuccess();
    closeModal();
  };

  return (
    <div className="flex h-full max-h-[85vh] flex-col bg-white text-slate-900">
      {/* Step indicator */}
      <div className="shrink-0 border-b border-slate-100 px-4 pt-6 pb-4 sm:px-8">
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
                    done
                      ? 'bg-indigo-600 text-white'
                      : active
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                        : 'bg-slate-100 text-slate-400',
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

      {/* Step content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {step === 1 ? (
          <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar space-y-8">
            {/* Section: Account */}
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Account & branch</h3>
                  <p className="text-xs text-slate-400">
                    Reg.{' '}
                    <span className="font-mono font-black text-slate-600">
                      {studentRecord.studentProfile?.registrationNumber || '—'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Full name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className={cn(inputClass, 'pl-11')}
                      value={form.fullName}
                      onChange={(e) => set({ fullName: e.target.value })}
                      placeholder="Student name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mobile (login)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className={cn(inputClass, 'pl-11')}
                      value={form.mobile}
                      onChange={(e) => set({ mobile: e.target.value })}
                      placeholder="017XXXXXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className={cn(inputClass, 'pl-11')}
                      type="email"
                      value={form.email}
                      onChange={(e) => set({ email: e.target.value })}
                      placeholder="Email (optional)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>New password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className={cn(inputClass, 'pl-11')}
                      type="password"
                      value={form.password}
                      onChange={(e) => set({ password: e.target.value })}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Branch</label>
                  <Select value={form.branchId} onValueChange={(v) => set({ branchId: v })}>
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
                  <Select value={form.status} onValueChange={(v) => set({ status: v as UserStatus })}>
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
                    value={form.instituteId}
                    onSelect={(v) => set({ instituteId: v })}
                  />
                </div>
              </div>
            </div>

            {/* Section: Guardians & personal */}
            <div className="border-t border-slate-100 pt-8 space-y-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-slate-400" />
                <h4 className="text-sm font-black text-slate-700">Guardians & personal info</h4>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Father name</label>
                  <Input className={inputClass} value={form.fatherName} onChange={(e) => set({ fatherName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother name</label>
                  <Input className={inputClass} value={form.motherName} onChange={(e) => set({ motherName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Father mobile</label>
                  <Input className={inputClass} value={form.fatherMobile} onChange={(e) => set({ fatherMobile: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Mother mobile</label>
                  <Input className={inputClass} value={form.motherMobile} onChange={(e) => set({ motherMobile: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Date of birth</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 font-bold', !form.dob && 'text-slate-400')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.dob ? format(parseDateInput(form.dob)!, 'dd-MM-yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar
                        selected={parseDateInput(form.dob)}
                        onSelect={(date) => set({ dob: formatDateInput(date) })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>Gender</label>
                  <Select value={form.gender} onValueChange={(v) => set({ gender: v })}>
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
                <div className="space-y-2">
                  <label className={sectionLabel}>Blood group</label>
                  <Select value={form.bloodGroup} onValueChange={(v) => set({ bloodGroup: v })}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>SSC GPA</label>
                  <Input
                    className={inputClass}
                    placeholder="e.g. 5.00"
                    value={(typeof form.sscInfo === 'object' && form.sscInfo?.gpa != null ? String(form.sscInfo.gpa) : '')}
                    onChange={(e) =>
                      set({ sscInfo: { ...(typeof form.sscInfo === 'object' && form.sscInfo ? form.sscInfo : {}), gpa: e.target.value || undefined } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className={sectionLabel}>HSC GPA</label>
                  <Input
                    className={inputClass}
                    placeholder="e.g. 5.00"
                    value={(typeof form.hscInfo === 'object' && form.hscInfo?.gpa != null ? String(form.hscInfo.gpa) : '')}
                    onChange={(e) =>
                      set({ hscInfo: { ...(typeof form.hscInfo === 'object' && form.hscInfo ? form.hscInfo : {}), gpa: e.target.value || undefined } })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>SMS alerts</label>
                  <div className="flex flex-wrap gap-6">
                    {(['SELF', 'FATHER', 'MOTHER'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                        <Checkbox
                          checked={form.smsAlertTo.includes(opt)}
                          onCheckedChange={(checked) =>
                            set({
                              smsAlertTo: checked
                                ? [...form.smsAlertTo, opt]
                                : form.smsAlertTo.filter((x) => x !== opt),
                            })
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Address</label>
                  <textarea
                    className="w-full min-h-22 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    placeholder="Address"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-black uppercase tracking-widest text-rose-600">
                {error}
              </div>
            )}
          </div>
        ) : (
          <AddEnrollmentForm
            key={`${studentRecord.id}-${enrollmentBranchId}`}
            studentId={studentRecord.id}
            defaultBranchId={enrollmentBranchId || undefined}
            onSuccess={handleEnrollSuccess}
            nestedInParentWizard={{
              parentStep: step,
              setParentStep: setStep,
              onBackToProfile: () => setStep(1),
            }}
          />
        )}
      </div>

      {/* Footer — only shown for step 1 (AddEnrollmentForm owns its own footer in steps 2–4) */}
      {step === 1 && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-8 pb-8 pt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="h-14 rounded-2xl flex-1 font-black uppercase tracking-widest text-[11px] bg-slate-700 text-white border-slate-700 hover:bg-slate-800 hover:text-white"
            onClick={closeModal}
          >
            Cancel
          </Button>
          <Button
            className="h-14 flex-2 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
            onClick={handleSaveAndNext}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : (
              <>
                Save & next
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
