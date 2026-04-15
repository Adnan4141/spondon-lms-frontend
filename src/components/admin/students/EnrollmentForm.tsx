'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { distributeProportionalByFee } from '@/lib/admission-distribution';
import { validateAdmissionPayment, netPayableAfterAdjustments } from '@/lib/admission-payment-zod';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { getCourses, type Course } from '@/lib/api/courses';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getPrograms, getProgramById, type Program } from '@/lib/api/programs';
import { getBatches, type Batch } from '@/lib/api/batches';
import {
  offlineAdmission,
  getEnrollments,
  updateEnrollment,
  type Enrollment,
  type PaymentMethodType,
} from '@/lib/api/enrollments';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Plus,
  Wallet,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Zod schema ──────────────────────────────────────────────────────────────

const courseRowSchema = z.object({
  courseId: z.string().min(1),
  batchId: z.string().optional(),
});

const enrollSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  billingType: z.enum(['ONE_TIME', 'MONTHLY']),
  billingStartMonth: z.string(),
  courses: z.array(courseRowSchema).min(1, 'Select at least one course'),
  includeBooks: z.boolean(),
  totalDiscountAmount: z.string(),
  discountReference: z.string(),
  monthlyFlatDiscount: z.string(),
  totalPaymentAmount: z.string(),
  paymentMethod: z.enum(['CASH', 'BKASH']),
  paymentTrxId: z.string(),
  nextPaymentDueDate: z.string(),
  installmentCount: z.number(),
});

type EnrollFormValues = z.infer<typeof enrollSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Courses', 'Payment', 'Confirm'] as const;
const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';

function defaultMonth() {
  return new Date().toISOString().slice(0, 7);
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface EnrollmentFormProps {
  studentId: string;
  defaultBranchId?: string;
  defaultProgramId?: string;
  onSuccess: () => void | Promise<void>;
  /** When embedded in a parent wizard (e.g. EditStudentWizard or AddStudentWizard). */
  nestedInParentWizard?: {
    parentStep: number;
    setParentStep: (step: number) => void;
    onBackToProfile: () => void;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EnrollmentForm({
  studentId,
  defaultBranchId,
  defaultProgramId,
  onSuccess,
  nestedInParentWizard,
}: EnrollmentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  // ─── Step management ───────────────────────────────────────────────────────
  const [internalStep, setInternalStep] = useState(1);
  const nested = nestedInParentWizard;
  const step = nested ? nested.parentStep - 1 : internalStep;

  // ─── Data state ────────────────────────────────────────────────────────────
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [programCourses, setProgramCourses] = useState<Course[]>([]);
  const [programId, setProgramId] = useState(defaultProgramId ?? '');
  const [enrollmentMode, setEnrollmentMode] = useState<'program' | 'search'>('program');
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [enrollmentByCourse, setEnrollmentByCourse] = useState<Map<string, Enrollment>>(new Map());
  const [availableBatches, setAvailableBatches] = useState<Record<string, Batch[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Admission fee overrides ────────────────────────────────────────────────
  const [admissionFeeOverrides, setAdmissionFeeOverrides] = useState<Record<string, string>>({});

  // ─── RHF setup ──────────────────────────────────────────────────────────────
  const form = useForm<EnrollFormValues>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      branchId: defaultBranchId ?? '',
      billingType: 'ONE_TIME',
      billingStartMonth: defaultMonth(),
      courses: [],
      includeBooks: true,
      totalDiscountAmount: '',
      discountReference: '',
      monthlyFlatDiscount: '',
      totalPaymentAmount: '',
      paymentMethod: 'CASH',
      paymentTrxId: '',
      nextPaymentDueDate: '',
      installmentCount: 0,
    },
  });

  const { control, watch, setValue, getValues, formState: { errors } } = form;

  const { fields: courseFields, append: appendCourse, remove: removeCourse } = useFieldArray({
    control,
    name: 'courses',
  });

  // ─── Watched values ─────────────────────────────────────────────────────────
  const watchedCourses = watch('courses');
  const watchedBillingType = watch('billingType');
  const watchedBranchId = watch('branchId');
  const watchedDiscount = watch('totalDiscountAmount');
  const watchedPayment = watch('totalPaymentAmount');

  // ─── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [progRes, branchRes, courseRes] = await Promise.all([
          getPrograms(),
          getBranches(),
          getCourses({ status: 'ACTIVE', limit: 400 }),
        ]);
        if (progRes.success && progRes.data) setPrograms(progRes.data);
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        if (courseRes.success && courseRes.data) setAllCourses(courseRes.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // ─── Load enrolled courses for this student+branch ──────────────────────────
  useEffect(() => {
    if (!studentId || !watchedBranchId) { setEnrolledCourseIds([]); return; }
    let cancelled = false;
    (async () => {
      const res = await getEnrollments({ studentUserId: studentId, branchId: watchedBranchId, limit: 500 });
      if (cancelled) return;
      if (res.success && res.data) {
        const ids = [...new Set(res.data.flatMap((e) => (e.enrollmentCourses || []).map(ec => ec.courseId)))];
        setEnrolledCourseIds(ids);
        const map = new Map<string, Enrollment>();
        for (const e of res.data) {
          for (const ec of (e.enrollmentCourses || [])) {
            const ex = map.get(ec.courseId);
            if (!ex || e.status === 'ACTIVE' || ex.status === 'CANCELLED') map.set(ec.courseId, e);
          }
        }
        setEnrollmentByCourse(map);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, watchedBranchId]);

  // ─── Load program courses + auto-set billing type ───────────────────────────
  useEffect(() => {
    if (!programId) { setProgramCourses([]); return; }
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await getProgramById(programId);
        if (res.success && res.data) {
          if (res.data.courses) setProgramCourses(res.data.courses as Course[]);
          // Auto-populate billing type from program
          const pc = (res.data as Program).paymentCircle;
          if (pc === 'MONTHLY' || pc === 'ONE_TIME') {
            setValue('billingType', pc);
          }
        }
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [programId, setValue]);

  // ─── Remove already-enrolled courses from selection ─────────────────────────
  const enrolledSet = useMemo(() => new Set(enrolledCourseIds), [enrolledCourseIds]);

  // ─── Course map ─────────────────────────────────────────────────────────────
  const courseMap = useMemo(() => {
    const m = new Map<string, Course>();
    programCourses.forEach((c) => m.set(c.id, c));
    allCourses.forEach((c) => m.set(c.id, c));
    return m;
  }, [programCourses, allCourses]);

  // ─── Selected course IDs (from field array) ─────────────────────────────────
  const selectedCourseIds = useMemo(() => watchedCourses.map((r) => r.courseId), [watchedCourses]);

  // ─── Filtered course list for picker ────────────────────────────────────────
  const pickerCourses = useMemo(() => {
    const base = enrollmentMode === 'program' ? programCourses : allCourses;
    const q = searchQuery.trim().toLowerCase();
    return base.filter((c) => {
      if (enrolledSet.has(c.id)) return false;
      if (selectedCourseIds.includes(c.id)) return false;
      if (q) return c.name.toLowerCase().includes(q) || (c.slug ?? '').toLowerCase().includes(q);
      return true;
    });
  }, [enrollmentMode, programCourses, allCourses, searchQuery, enrolledSet, selectedCourseIds]);

  // ─── Load batches for offline courses when branchId set ─────────────────────
  useEffect(() => {
    const branchId = watchedBranchId;
    if (!branchId) return;
    const offlineIds = selectedCourseIds.filter((id) => courseMap.get(id)?.type?.toUpperCase() === 'OFFLINE');
    if (offlineIds.length === 0) return;
    const missing = offlineIds.filter((id) => !availableBatches[id]);
    if (missing.length === 0) return;
    (async () => {
      setLoadingBatches(true);
      const next = { ...availableBatches };
      await Promise.all(missing.map(async (courseId) => {
        const res = await getBatches({ courseId, branchId, status: 'ACTIVE', limit: 100 });
        next[courseId] = res.data ?? [];
      }));
      setAvailableBatches(next);
      setLoadingBatches(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseIds.join(','), watchedBranchId]);

  // ─── Fee calculations ────────────────────────────────────────────────────────
  const totalCourseFee = useMemo(
    () => selectedCourseIds.reduce((s, id) => s + (Number(courseMap.get(id)?.fee) || 0), 0),
    [selectedCourseIds, courseMap],
  );

  const admissionFeePrograms = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; amount: number }[] = [];
    for (const id of selectedCourseIds) {
      const c = courseMap.get(id);
      const progId = (c?.program as { id?: string } | undefined)?.id ?? (enrollmentMode === 'program' ? programId : undefined);
      if (!progId || seen.has(progId)) continue;
      const prog = programs.find((p) => p.id === progId);
      if (prog?.admissionFeeEnabled && prog.admissionFeeAmount && Number(prog.admissionFeeAmount) > 0) {
        seen.add(progId);
        out.push({ id: prog.id, name: prog.name, amount: Number(prog.admissionFeeAmount) });
      }
    }
    return out;
  }, [selectedCourseIds, courseMap, programs, programId, enrollmentMode]);

  useEffect(() => {
    if (!admissionFeePrograms.length) return;
    setAdmissionFeeOverrides((prev) => {
      const next: Record<string, string> = {};
      for (const p of admissionFeePrograms) {
        next[p.id] = prev[p.id] ?? String(p.amount);
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, enrollmentMode]);

  const effectiveAdmissionFeeTotal = useMemo(
    () => admissionFeePrograms.reduce((s, p) => s + (Number(admissionFeeOverrides[p.id]) || 0), 0),
    [admissionFeePrograms, admissionFeeOverrides],
  );

  const grossBeforeDiscount = useMemo(
    () => totalCourseFee + effectiveAdmissionFeeTotal,
    [totalCourseFee, effectiveAdmissionFeeTotal],
  );

  const totalDiscountNum = Number(watchedDiscount) || 0;
  const totalPaymentNum = Number(watchedPayment) || 0;

  const netPayable = useMemo(
    () => netPayableAfterAdjustments(grossBeforeDiscount, totalDiscountNum),
    [grossBeforeDiscount, totalDiscountNum],
  );

  const balanceAfterPay = useMemo(
    () => Math.max(0, Math.round((netPayable - totalPaymentNum) * 100) / 100),
    [netPayable, totalPaymentNum],
  );

  const adjustmentsOverTotalFees = grossBeforeDiscount > 0 && totalDiscountNum > grossBeforeDiscount + 1e-6;
  const maxDiscountAllowed = Math.max(0, Math.round(grossBeforeDiscount * 100) / 100);

  // Auto-cap payment to net payable
  useEffect(() => {
    const pay = Number(getValues('totalPaymentAmount')) || 0;
    if (pay > netPayable + 0.0001) setValue('totalPaymentAmount', String(netPayable));
  }, [netPayable, getValues, setValue]);

  // Default payment amount when entering step 2
  const setDefaultPayment = () => {
    const current = Number(getValues('totalPaymentAmount')) || 0;
    if (current === 0) setValue('totalPaymentAmount', String(Math.round(grossBeforeDiscount * 100) / 100));
  };

  const distributedPreview = useMemo(() => {
    const feeFn = (id: string) => Number(courseMap.get(id)?.fee) || 0;
    const discMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalDiscountNum);
    const payMap = distributeProportionalByFee(selectedCourseIds, feeFn, totalPaymentNum);
    const rows = selectedCourseIds.map((id) => {
      const fee = feeFn(id);
      const d = discMap[id] ?? 0;
      const p = payMap[id] ?? 0;
      const payable = Math.max(fee - d, 0);
      const due = Math.max(payable - p, 0);
      return { id, fee, disc: d, pay: p, payable, due };
    });
    return rows;
  }, [selectedCourseIds, courseMap, totalDiscountNum, totalPaymentNum]);

  // ─── Add / remove course from selection ─────────────────────────────────────
  const addCourse = (courseId: string) => {
    if (enrolledSet.has(courseId)) return;
    if (selectedCourseIds.includes(courseId)) return;
    appendCourse({ courseId, batchId: '' });
    setPickerOpen(false);
    setSearchQuery('');
  };

  const handleResumeEnrollment = async (courseId: string) => {
    const enrollment = enrollmentByCourse.get(courseId);
    if (!enrollment || enrollment.status !== 'PAUSED') return;
    const res = await updateEnrollment(enrollment.id, { status: 'ACTIVE', reason: 'Resumed by admin' });
    if (res.success) {
      toast({ title: 'Enrollment resumed', variant: 'success' });
      const updated = await getEnrollments({ studentUserId: studentId, branchId: watchedBranchId, limit: 500 });
      if (updated.success && updated.data) {
        setEnrolledCourseIds([...new Set(updated.data.flatMap((e) => (e.enrollmentCourses || []).map(ec => ec.courseId)))]);
      }
    } else {
      toast({ title: 'Error', description: res.message || 'Resume failed', variant: 'destructive' });
    }
  };

  // ─── Step validation & navigation ────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (selectedCourseIds.length === 0 || !watchedBranchId) {
      setError('Select at least one course and a branch');
      return false;
    }
    if (selectedCourseIds.some((id) => enrolledSet.has(id))) {
      setError('Some selected courses are already enrolled at this branch');
      return false;
    }
    if (watchedBillingType === 'MONTHLY' && !/^\d{4}-\d{2}$/.test(getValues('billingStartMonth').trim())) {
      setError('Billing month is required for monthly billing');
      return false;
    }
    const offlineWithoutBatch = selectedCourseIds.filter(
      (id) => courseMap.get(id)?.type?.toUpperCase() === 'OFFLINE' && !watchedCourses.find((r) => r.courseId === id)?.batchId,
    );
    if (offlineWithoutBatch.length > 0) {
      const names = offlineWithoutBatch.map((id) => courseMap.get(id)?.name ?? id).join(', ');
      setError(`Batch required for offline course(s): ${names}`);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    const vals = getValues();
    const v = validateAdmissionPayment(grossBeforeDiscount, 'offline', {
      totalDiscountAmount: vals.totalDiscountAmount,
      totalPaymentAmount: vals.totalPaymentAmount,
      discountReference: vals.discountReference,
      paymentMethod: vals.paymentMethod,
      paymentTrxId: vals.paymentTrxId,
    });
    if (v.ok === false) { setError(v.message); return false; }
    setError(null);
    return true;
  };

  const goNext = async () => {
    setError(null);
    if (step === 1) {
      if (!validateStep1()) return;
      setDefaultPayment();
    }
    if (step === 2) {
      if (!validateStep2()) return;
    }
    if (nested) nested.setParentStep(Math.min(4, nested.parentStep + 1));
    else setInternalStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError(null);
    if (nested) {
      if (nested.parentStep <= 2) nested.onBackToProfile();
      else nested.setParentStep(nested.parentStep - 1);
    } else {
      setInternalStep((s) => Math.max(1, s - 1));
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    const vals = getValues();
    if (selectedCourseIds.some((id) => enrolledSet.has(id))) {
      setError('Selection includes already-enrolled courses. Go back to step 1.');
      return;
    }
    const needsMonth = vals.billingType === 'MONTHLY';
    const nextDueIso = vals.nextPaymentDueDate && /^\d{4}-\d{2}$/.test(vals.nextPaymentDueDate.trim())
      ? new Date(`${vals.nextPaymentDueDate.trim()}-01T12:00:00`).toISOString()
      : undefined;

    try {
      setSubmitting(true);
      setError(null);
      const feeOverrides: Record<string, number> = {};
      for (const p of admissionFeePrograms) {
        const v = Number(admissionFeeOverrides[p.id]);
        if (!Number.isNaN(v) && v >= 0) feeOverrides[p.id] = v;
      }
      const adm = await offlineAdmission({
        studentUserId: studentId,
        programId: programId,
        branchId: vals.branchId,
        courses: vals.courses.map(({ courseId, batchId }) => ({ courseId, batchId: batchId || undefined, includeBook: vals.includeBooks })),
        billingType: vals.billingType,
        billingStartMonth: needsMonth ? vals.billingStartMonth || undefined : undefined,
        paymentMethod: vals.paymentMethod,
        paymentAmount: Number(vals.totalPaymentAmount) || 0,
        paymentTrxId:
          Number(vals.totalPaymentAmount) > 0 && vals.paymentMethod !== 'CASH'
            ? vals.paymentTrxId.trim() || undefined
            : undefined,
        discountAmount: totalDiscountNum > 0 ? totalDiscountNum : undefined,
        discountReference: totalDiscountNum > 0 ? vals.discountReference.trim() || undefined : undefined,
        monthlyFlatDiscount: Number(vals.monthlyFlatDiscount) || undefined,
        oneTimeDiscount: totalDiscountNum > 0 && vals.billingType === 'ONE_TIME' ? totalDiscountNum : undefined,
        nextPaymentDueDate: nextDueIso,
        admissionFeeAmountOverrides: Object.keys(feeOverrides).length > 0 ? feeOverrides : undefined,
        installmentCount:
          vals.billingType === 'ONE_TIME' && vals.installmentCount > 0 ? vals.installmentCount : undefined,
      });
      if (!adm.success) throw new Error(adm.message || 'Admission failed');
      if (adm.data?.pdfUrl) window.open(adm.data.pdfUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: 'Enrolled!',
        description: `${selectedCourseIds.length} course(s) enrolled.${adm.data?.pdfUrl ? ' Invoice PDF opened.' : ''}`,
        variant: 'success',
      });
      if (!nested) closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full max-h-[min(90vh,820px)] flex-col bg-white text-slate-900">
      {/* Step indicator (hidden when nested, parent owns the stepper) */}
      {!nested && (
        <div className="border-b border-slate-100 px-4 pt-5 pb-4 sm:px-6">
          <div className="grid w-full grid-cols-3 gap-2">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      done
                        ? 'bg-indigo-600 text-white'
                        : active
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                          : 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : n}
                  </div>
                  <span className={cn('text-[11px] font-semibold', active ? 'text-indigo-700' : 'text-slate-500')}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 no-scrollbar space-y-6">

        {/* ══ STEP 1: Course selection ════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Branch selector */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Branch</span>
              <Controller
                control={control}
                name="branchId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(inputClass, 'w-full')}>
                      <SelectValue placeholder="Select branch…" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.branchId && <p className="mt-1 text-xs text-red-500">{errors.branchId.message}</p>}
            </div>

            {/* Billing type badge (read-only, auto-set from program) */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">Billing type</span>
              {watchedBillingType === 'MONTHLY' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  Monthly
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                  One-Time
                </span>
              )}
              {!programId && enrollmentMode === 'program' && (
                <span className="text-[10px] text-slate-400 italic">— select a program to set</span>
              )}
            </div>

            {/* Billing start month — only required for MONTHLY */}
            {watchedBillingType === 'MONTHLY' && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">
                  Billing start month *
                </span>
                <Controller
                  control={control}
                  name="billingStartMonth"
                  render={({ field }) => (
                    <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Pick month…" />
                  )}
                />
                {errors.billingStartMonth && <p className="mt-1 text-xs text-red-500">{errors.billingStartMonth.message}</p>}
              </div>
            )}

            {/* Mode switcher */}
            <div className="flex gap-2">
              {(['program', 'search'] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={enrollmentMode === mode ? 'default' : 'outline'}
                  className={cn(
                    'h-9 rounded-xl text-[10px] font-black uppercase',
                    enrollmentMode === mode && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white',
                  )}
                  onClick={() => { setEnrollmentMode(mode); setSearchQuery(''); }}
                >
                  {mode === 'program' ? 'By Program' : 'Search All'}
                </Button>
              ))}
            </div>

            {/* Program selector (program mode) */}
            {enrollmentMode === 'program' && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Program</span>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger className={cn(inputClass, 'w-full')}>
                    <SelectValue placeholder="Select program…" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-bold">{p.name}</span>
                        {p.paymentCircle && (
                          <Badge variant="outline" className={cn(
                            'ml-2 text-[9px]',
                            p.paymentCircle === 'MONTHLY'
                              ? 'border-green-200 bg-green-50 text-green-800'
                              : 'border-indigo-200 bg-indigo-50 text-indigo-800',
                          )}>
                            {p.paymentCircle === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Course picker popover */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-dashed border-slate-300 text-slate-500 font-bold text-sm gap-2 hover:border-indigo-400 hover:text-indigo-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3 rounded-2xl shadow-xl" align="start">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search courses…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
                {loadingCourses ? (
                  <p className="py-4 text-center text-xs text-slate-400">Loading…</p>
                ) : pickerCourses.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    {enrollmentMode === 'program' && !programId ? 'Select a program first' : 'No courses found'}
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
                    {pickerCourses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => addCourse(c.id)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{c.name}</p>
                          <p className="text-xs text-slate-500 font-medium">৳{Number(c.fee).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CourseDeliveryBadge type={c.type} />
                          {(() => {
                            const pc = programs.find((p) => p.id === (c as any).programId)?.paymentCircle;
                            if (!pc) return null;
                            return (
                              <Badge variant="outline" className={cn(
                                'text-[8px]',
                                pc === 'MONTHLY'
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : 'border-indigo-200 bg-indigo-50 text-indigo-700',
                              )}>
                                {pc === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                              </Badge>
                            );
                          })()}
                          <Plus className="h-4 w-4 text-indigo-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {errors.courses && (
              <p className="text-xs text-red-500">{(errors.courses as { message?: string }).message}</p>
            )}

            {/* Selected course rows */}
            {courseFields.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">
                  Selected Courses ({courseFields.length})
                </span>
                {courseFields.map((field, index) => {
                  const course = courseMap.get(field.courseId);
                  const isOffline = course?.type?.toUpperCase() === 'OFFLINE';
                  const batchList = availableBatches[field.courseId] ?? [];
                  const start = course?.startMonth;
                  const end = course?.endMonth;
                  return (
                    <div
                      key={field.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm leading-tight truncate">{course?.name ?? field.courseId}</p>
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">৳{Number(course?.fee ?? 0).toLocaleString()}</p>
                          {start && (
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {start} → {end ?? '?'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <CourseDeliveryBadge type={course?.type} />
                          {(() => {
                            const pc = programs.find((p) => p.id === (course as any)?.programId)?.paymentCircle;
                            if (!pc) return null;
                            return (
                              <Badge variant="outline" className={cn(
                                'text-[8px]',
                                pc === 'MONTHLY'
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : 'border-indigo-200 bg-indigo-50 text-indigo-700',
                              )}>
                                {pc === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                              </Badge>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => removeCourse(index)}
                            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Batch selector for OFFLINE courses */}
                      {isOffline && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Batch {batchList.length === 0 && loadingBatches ? '(loading…)' : batchList.length === 0 ? '(none available)' : ''}
                          </span>
                          <Controller
                            control={control}
                            name={`courses.${index}.batchId`}
                            render={({ field: batchField }) => (
                              <Select
                                value={batchField.value ?? ''}
                                onValueChange={batchField.onChange}
                                disabled={batchList.length === 0}
                              >
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-sm font-bold">
                                  <SelectValue placeholder="Select batch…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {batchList.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Already-enrolled courses at this branch */}
            {enrolledCourseIds.length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Already enrolled at this branch
                  </span>
                </div>
                <div className="space-y-2">
                  {enrolledCourseIds.map((id) => {
                    const c = courseMap.get(id);
                    const e = enrollmentByCourse.get(id);
                    const isPaused = e?.status === 'PAUSED';
                    return (
                      <div key={id} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 truncate">{c?.name ?? id}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={cn(
                            'text-[9px]',
                            e?.status === 'ACTIVE' ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500',
                          )}>
                            {e?.status ?? 'ENROLLED'}
                          </Badge>
                          {isPaused && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] font-black rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleResumeEnrollment(id)}
                            >
                              Resume
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Include books */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3">
              <Controller
                control={control}
                name="includeBooks"
                render={({ field }) => (
                  <Checkbox id="includeBooks" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <label htmlFor="includeBooks" className="flex items-center gap-2 cursor-pointer">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-700">Include books with enrollment</span>
              </label>
            </div>
          </>
        )}

        {/* ══ STEP 2: Payment ════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* Fee summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 block mb-3">Fee Summary</span>
              {distributedPreview.map(({ id, fee }) => {
                const c = courseMap.get(id);
                return (
                  <div key={id} className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700 truncate max-w-[60%]">{c?.name ?? id}</span>
                    <span className="font-black text-slate-900">৳{fee.toLocaleString()}</span>
                  </div>
                );
              })}
              {admissionFeePrograms.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500">Admission ({p.name})</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={admissionFeeOverrides[p.id] ?? ''}
                      onChange={(e) => setAdmissionFeeOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="h-8 w-24 rounded-xl text-right text-sm font-bold"
                    />
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm">
                <span>Gross Total</span>
                <span className="text-indigo-700">৳{grossBeforeDiscount.toLocaleString()}</span>
              </div>
            </div>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Discount (৳)</span>
                <Controller
                  control={control}
                  name="totalDiscountAmount"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={maxDiscountAllowed}
                      placeholder="0"
                      className={inputClass}
                    />
                  )}
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Discount reference</span>
                <Controller
                  control={control}
                  name="discountReference"
                  render={({ field }) => (
                    <Input {...field} placeholder="Reason / ref…" className={inputClass} />
                  )}
                />
              </div>
            </div>

            {adjustmentsOverTotalFees && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Discount exceeds total fee.
              </div>
            )}

            {/* Monthly flat discount (for MONTHLY billing) */}
            {watchedBillingType === 'MONTHLY' && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">
                  Monthly flat discount (৳) — recurring each month
                </span>
                <Controller
                  control={control}
                  name="monthlyFlatDiscount"
                  render={({ field }) => (
                    <Input {...field} type="number" min={0} placeholder="0" className={inputClass} />
                  )}
                />
              </div>
            )}

            {/* Net payable */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Net Payable</p>
                <p className="text-2xl font-black text-indigo-700">৳{netPayable.toLocaleString()}</p>
              </div>
              <Wallet className="h-8 w-8 text-indigo-300" />
            </div>

            {/* Payment section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Collecting now (৳)</span>
                <Controller
                  control={control}
                  name="totalPaymentAmount"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={netPayable}
                      placeholder="0"
                      disabled={adjustmentsOverTotalFees}
                      className={inputClass}
                    />
                  )}
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Payment method</span>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as PaymentMethodType)}>
                      <SelectTrigger className={cn(inputClass, 'w-full')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BKASH">bKash</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* TrxID for non-cash */}
            {watch('paymentMethod') !== 'CASH' && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">Transaction ID</span>
                <Controller
                  control={control}
                  name="paymentTrxId"
                  render={({ field }) => (
                    <Input {...field} placeholder="bKash / ref ID…" className={inputClass} />
                  )}
                />
              </div>
            )}

            {/* Next payment due (for partial / monthly) */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">
                Next payment due month (optional)
              </span>
              <Controller
                control={control}
                name="nextPaymentDueDate"
                render={({ field }) => (
                  <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Pick month…" />
                )}
              />
            </div>

            {/* Installment selector (ONE_TIME only) */}
            {watchedBillingType === 'ONE_TIME' && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1">
                  Installments (optional) — 2 or 3 splits
                </span>
                <Controller
                  control={control}
                  name="installmentCount"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger className={cn(inputClass, 'w-full')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No installment (full)</SelectItem>
                        <SelectItem value="2">2 installments</SelectItem>
                        <SelectItem value="3">3 installments</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Due balance */}
            {balanceAfterPay > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <span className="text-xs font-black text-amber-700">Due balance</span>
                <span className="font-black text-amber-800">৳{balanceAfterPay.toLocaleString()}</span>
              </div>
            )}

            {/* Per-course distribution preview */}
            {selectedCourseIds.length > 1 && (
              <DistributionTable rows={distributedPreview} courseMap={courseMap} />
            )}
          </>
        )}

        {/* ══ STEP 3: Confirm ════════════════════════════════════════════════ */}
        {step === 3 && (
          <>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                <span className="font-black text-slate-800 text-sm uppercase tracking-wider">Enrollment Summary</span>
              </div>

              <SummaryRow label="Branch">
                {branches.find((b) => b.id === getValues('branchId'))?.name ?? getValues('branchId')}
              </SummaryRow>
              <SummaryRow label="Billing type">
                <Badge variant="outline" className={cn(
                  'text-xs',
                  watchedBillingType === 'MONTHLY'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-700',
                )}>
                  {watchedBillingType === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                </Badge>
              </SummaryRow>
              {watchedBillingType === 'MONTHLY' && getValues('billingStartMonth') && (
                <SummaryRow label="Billing start">{getValues('billingStartMonth')}</SummaryRow>
              )}

              <div className="border-t border-indigo-100 pt-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Courses</p>
                {courseFields.map((f) => {
                  const c = courseMap.get(f.courseId);
                  const batchId = f.batchId;
                  const batch = batchId ? (availableBatches[f.courseId] ?? []).find((b) => b.id === batchId) : null;
                  return (
                    <div key={f.id} className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-sm font-bold text-slate-800">{c?.name ?? f.courseId}</span>
                        {batch && <span className="ml-2 text-xs text-slate-400">@ {batch.name}</span>}
                      </div>
                      <span className="text-sm font-black text-indigo-700">৳{Number(c?.fee ?? 0).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {admissionFeePrograms.length > 0 && (
                <div className="border-t border-indigo-100 pt-3 space-y-1">
                  {admissionFeePrograms.map((p) => (
                    <SummaryRow key={p.id} label={`Admission (${p.name})`}>
                      ৳{(Number(admissionFeeOverrides[p.id]) || p.amount).toLocaleString()}
                    </SummaryRow>
                  ))}
                </div>
              )}

              <div className="border-t border-indigo-100 pt-3 space-y-1">
                <SummaryRow label="Gross total">৳{grossBeforeDiscount.toLocaleString()}</SummaryRow>
                {totalDiscountNum > 0 && (
                  <SummaryRow label="Discount">−৳{totalDiscountNum.toLocaleString()}</SummaryRow>
                )}
                <SummaryRow label="Net payable">
                  <span className="font-black text-indigo-700">৳{netPayable.toLocaleString()}</span>
                </SummaryRow>
                {totalPaymentNum > 0 && (
                  <SummaryRow label="Collecting now">
                    <span className="text-emerald-700 font-black">৳{totalPaymentNum.toLocaleString()}</span>
                  </SummaryRow>
                )}
                {balanceAfterPay > 0 && (
                  <SummaryRow label="Due balance">
                    <span className="text-amber-700 font-black">৳{balanceAfterPay.toLocaleString()}</span>
                  </SummaryRow>
                )}
              </div>

              <SummaryRow label="Payment method">
                {getValues('paymentMethod')}
                {getValues('paymentTrxId') && ` — ${getValues('paymentTrxId')}`}
              </SummaryRow>
              <SummaryRow label="Include books">{getValues('includeBooks') ? 'Yes' : 'No'}</SummaryRow>
            </div>
          </>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* ── Footer nav ──────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-5 py-4 flex items-center gap-3">
        {(step > 1 || nested) && (
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 rounded-2xl font-bold"
            onClick={goBack}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <Button
            type="button"
            className="gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold px-6"
            onClick={goNext}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black px-8"
            onClick={handleSubmit}
            disabled={submitting || adjustmentsOverTotalFees}
          >
            {submitting ? 'Enrolling…' : 'Confirm Enrollment'}
            {!submitting && <Check className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-bold text-slate-800 text-right">{children}</span>
    </div>
  );
}

function DistributionTable({
  rows,
  courseMap,
}: {
  rows: Array<{ id: string; fee: number; disc: number; pay: number; payable: number; due: number }>;
  courseMap: Map<string, Course>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Distribution preview (proportional)
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 text-slate-500 font-black uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Course</th>
                <th className="px-3 py-2 text-right">Fee</th>
                <th className="px-3 py-2 text-right">Disc</th>
                <th className="px-3 py-2 text-right">Payable</th>
                <th className="px-3 py-2 text-right">Pay</th>
                <th className="px-3 py-2 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ id, fee, disc, payable, pay, due }) => (
                <tr key={id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-700 max-w-40 truncate">
                    {courseMap.get(id)?.name ?? id}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">৳{fee.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold text-red-500">{disc > 0 ? `−৳${disc.toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-2 text-right font-bold">৳{payable.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-600">{pay > 0 ? `৳${pay.toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-2 text-right font-bold text-amber-600">{due > 0 ? `৳${due.toLocaleString()}` : '✓'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
