'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Info } from 'lucide-react';
import { z } from 'zod';
import { format as formatDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments, offlineAdmission, type OfflineAdmissionDto } from '@/lib/api/enrollments';
import type { BranchOption, Course, Program, SelCourseState, Student } from '../types';
import { currentMonth, distributeDiscount, fmt } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import { StudentAdminSelect as AppSelect } from '../components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '../components/StudentMonthInput';

type EnrollmentValidationErrors = Partial<Record<string, string>>;

function collectZodErrors(result: unknown): EnrollmentValidationErrors {
  const parsed = result as { success: boolean; error?: z.ZodError };
  if (parsed.success || !parsed.error) return {};
  return parsed.error.issues.reduce<EnrollmentValidationErrors>((acc, issue) => {
    const key = issue.path.join('.') || 'form';
    acc[key] ??= issue.message;
    return acc;
  }, {});
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function moneyNumber(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function effectiveCourseFee(course: Course): number {
  return course.offerPrice !== null && course.offerPrice !== undefined
    ? moneyNumber(course.offerPrice)
    : moneyNumber(course.fee);
}

function distributeEqualCents<T extends { due: number }>(items: T[], amount: number) {
  const dueByIndex = items.map(item => Math.max(0, Math.round((Number(item.due) || 0) * 100)));
  const appliedByIndex = items.map(() => 0);
  let remaining = Math.max(0, Math.round((Number(amount) || 0) * 100));

  while (remaining > 0) {
    const activeIndexes = dueByIndex
      .map((due, index) => ({ due, index }))
      .filter(item => item.due > 0)
      .map(item => item.index);

    if (activeIndexes.length === 0) break;

    const baseShare = Math.floor(remaining / activeIndexes.length);
    const remainder = remaining % activeIndexes.length;
    let loopApplied = 0;

    activeIndexes.forEach((itemIndex, orderIndex) => {
      const desired = baseShare + (orderIndex < remainder ? 1 : 0);
      const used = Math.min(dueByIndex[itemIndex], desired);
      if (used <= 0) return;
      dueByIndex[itemIndex] -= used;
      appliedByIndex[itemIndex] += used;
      loopApplied += used;
    });

    if (loopApplied <= 0) break;
    remaining -= loopApplied;
  }

  return {
    remainingAmount: roundMoney(remaining / 100),
    appliedAmounts: appliedByIndex.map(value => roundMoney(value / 100)),
  };
}

export function EnrollmentModal({
  student, programs, allCourses, branches, onClose, onSave,
}: {
  student: Student;
  programs: Program[];
  allCourses: Course[];
  branches: BranchOption[];
  onClose: () => void;
  onSave: (data: { student: Student; program: Program | undefined; netMonthly: number; admFee: number }) => void;
}) {
  const [step, setStep] = useState(1);
  const [programId, setProgramId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [selCourses, setSelCourses] = useState<Record<string, SelCourseState>>({});
  const [monthlyDiscount, setMonthlyDiscount] = useState('0');
  const [oneTimeDiscount, setOneTimeDiscount] = useState('0');
  const [admDiscount, setAdmDiscount] = useState('0');
  const [payNowAmount, setPayNowAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH'>('CASH');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState<Date | undefined>(undefined);
  const [billingStart, setBillingStart] = useState(() => currentMonth());
  const [courseBatches, setCourseBatches] = useState<Record<string, { id: string; name: string; status: string }[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  // Already-enrolled detection
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<Set<string>>(new Set());
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  useEffect(() => {
    getEnrollments({ studentUserId: student.id, limit: 50 })
      .then(res => {
        if (res.success && res.data) {
          setEnrolledProgramIds(new Set(res.data.map(e => e.programId)));
        }
      })
      .catch(() => {
        setEnrolledProgramIds(new Set());
      });
  }, [student.id]);

  // Initialize branchId: prefer student's own branch, then logged-in admin branch, then first available
  useEffect(() => {
    if (student.branchId) { setBranchId(student.branchId); return; }
    try {
      const raw = localStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : null;
      if (u?.branchId) {
        setBranchId(String(u.branchId));
      } else if (branches.length > 0) {
        setBranchId('');
      }
    } catch {
      if (branches.length > 0) setBranchId('');
    }
  }, [branches, student.branchId]);

  useEffect(() => {
    if (!programId || !branchId) { setCourseBatches({}); return; }
    setLoadingBatches(true);
    getBatches({ branchId: branchId || undefined, limit: 200 })
      .then(res => {
        if (res.success && res.data) {
          const map: Record<string, { id: string; name: string; status: string }[]> = {};
          for (const b of res.data) {
            map[b.courseId] ??= [];
            map[b.courseId].push({ id: b.id, name: b.name, status: b.status as string });
          }
          setCourseBatches(map);
        }
      })
      .catch(() => {
        setCourseBatches({});
      })
      .finally(() => setLoadingBatches(false));
  }, [programId, branchId]);

  // Detect already-enrolled programs/courses for this student
  useEffect(() => {
    if (!programId) {
      setEnrolledCourseIds(new Set());
      return;
    }
    setLoadingEnrolled(true);
    getEnrollments({ studentUserId: student.id, limit: 50 })
      .then(res => {
        if (res.success && res.data) {
          // Filter by selected program client-side (API doesn't support programId filter)
          const ids = new Set(
            res.data
              .filter(e => e.programId === programId)
              .flatMap(e => (e.enrollmentCourses ?? []).map((ec: { courseId: string }) => ec.courseId))
          );
          setEnrolledCourseIds(ids);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEnrolled(false));
  }, [programId, student.id]);

  const program = programs.find(p => p.id === programId);
  const isMonthlyProgram = program?.paymentCircle === 'MONTHLY';
  const courses = programId ? allCourses.filter(c => c.programId === programId) : [];
  const availableCourses = courses.filter(c => !enrolledCourseIds.has(c.id));
  const alreadyEnrolledCourses = courses.filter(c => enrolledCourseIds.has(c.id));
  // Sort: ONLINE or OFFLINE-with-active-batches first; OFFLINE-without-active-batches last
  const coursesWithBatches = loadingBatches
    ? availableCourses
    : availableCourses.filter(c => c.type === 'ONLINE' || courseBatches[c.id]?.some(b => b.status === 'ACTIVE'));
  const coursesNoBatch = loadingBatches
    ? []
    : availableCourses.filter(c => c.type === 'OFFLINE' && !courseBatches[c.id]?.some(b => b.status === 'ACTIVE'));
  const selected = availableCourses.filter(c => selCourses[c.id]?.checked);
  const grossCourseTotal = selected.reduce((s, c) => s + moneyNumber(c.fee), 0);
  const totalFee = selected.reduce((s, c) => s + effectiveCourseFee(c), 0);
  const promotionalDiscount = Math.max(0, grossCourseTotal - totalFee);
  const activeDiscount = isMonthlyProgram ? Number(monthlyDiscount) || 0 : Number(oneTimeDiscount) || 0;
  const selectedEffectiveCourses = selected.map(c => ({ ...c, fee: effectiveCourseFee(c) }));
  const distributed = distributeDiscount(selectedEffectiveCourses, activeDiscount);
  const netMonthly = Math.max(0, totalFee - (Number(monthlyDiscount) || 0));
  const oneTimeCoursePayable = Math.max(0, totalFee - (Number(oneTimeDiscount) || 0));
  const admFee = program?.admissionFeeEnabled
    ? Math.max(0, program.admissionFeeAmount - (Number(admDiscount) || 0))
    : 0;
  const coursePayable = isMonthlyProgram ? netMonthly : oneTimeCoursePayable;
  const totalPayable = Math.max(0, coursePayable + admFee);
  const payNow = Math.min(Number(payNowAmount) || 0, totalPayable);
  const dueAfterPay = Math.max(0, totalPayable - payNow);
  const needsNextDueDate = !isMonthlyProgram && dueAfterPay > 0;
  const nextDueDatePayload = needsNextDueDate && nextPaymentDueDate
    ? formatDate(nextPaymentDueDate, 'yyyy-MM-dd')
    : '';
  const nextDueDateLabel = nextPaymentDueDate
    ? formatDate(nextPaymentDueDate, 'dd-MM-yyyy')
    : '';
  const accessPreview = payNow > 0 ? 'FULL_ACCESS' : 'NO_ACCESS';
  const paymentDistributionPreview = useMemo(() => {
    const admissionApplied = roundMoney(Math.min(admFee, payNow));
    const remainingAfterAdmission = roundMoney(Math.max(0, payNow - admissionApplied));
    const courseRows = distributed.map(course => ({
      id: course.id,
      name: course.name,
      due: roundMoney(Math.max(0, course.fee - course.discount)),
    }));
    const distribution = distributeEqualCents(courseRows, remainingAfterAdmission);
    const courseAllocations = courseRows.map((course, index) => {
      const applied = distribution.appliedAmounts[index] || 0;
      return {
        ...course,
        applied,
        dueAfter: roundMoney(Math.max(0, course.due - applied)),
      };
    });

    return {
      admissionDue: admFee,
      admissionApplied,
      courseAllocations,
      remaining: distribution.remainingAmount,
      totalCourseDueAfter: roundMoney(courseAllocations.reduce((sum, row) => sum + row.dueAfter, 0)),
    };
  }, [admFee, distributed, payNow]);
  const validation = useMemo(() => {
    const schema = z.object({
      programId: z.string().trim().min(1, 'Program is required'),
      branchId: z.string().trim().min(1, 'Branch is required'),
      monthlyDiscount: z.coerce.number().refine(Number.isFinite, 'Monthly discount must be a valid amount').min(0, 'Monthly discount cannot be negative'),
      oneTimeDiscount: z.coerce.number().refine(Number.isFinite, 'One-time discount must be a valid amount').min(0, 'One-time discount cannot be negative'),
      admDiscount: z.coerce.number().refine(Number.isFinite, 'Admission discount must be a valid amount').min(0, 'Admission discount cannot be negative'),
      payNowAmount: z.coerce.number().refine(Number.isFinite, 'Pay now must be a valid amount').min(0, 'Pay now cannot be negative'),
      nextPaymentDueDate: z.date().optional(),
      paymentMethod: z.enum(['CASH', 'BKASH']),
      selectedCourseCount: z.number().min(1, 'Select at least one course'),
    }).superRefine((draft, ctx) => {
      if (isMonthlyProgram && draft.monthlyDiscount > totalFee) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monthlyDiscount'],
          message: 'Monthly discount cannot exceed selected course total',
        });
      }
      if (!isMonthlyProgram && draft.oneTimeDiscount > totalFee) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['oneTimeDiscount'],
          message: 'One-time discount cannot exceed selected course total',
        });
      }
      if (program?.admissionFeeEnabled && draft.admDiscount > program.admissionFeeAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['admDiscount'],
          message: 'Admission discount cannot exceed admission fee',
        });
      }
      if (draft.payNowAmount > totalPayable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payNowAmount'],
          message: 'Pay now cannot exceed total payable',
        });
      }
      if (draft.payNowAmount > 0 && !draft.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: 'Payment method is required when payment is collected',
        });
      }
      if (step === 2 && !isMonthlyProgram && dueAfterPay > 0 && !draft.nextPaymentDueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nextPaymentDueDate'],
          message: 'Next due date is required when one-time enrollment has a due amount',
        });
      }
      for (const course of selected) {
        const selectedStartMonth = selCourses[course.id]?.startMonth || course.startMonth || billingStart;
        const selectedEndMonth = selCourses[course.id]?.endMonth || course.endMonth || '';
        if (course.type === 'OFFLINE' && !selCourses[course.id]?.batch) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`batch.${course.id}`],
            message: 'Batch is required for offline course',
          });
        }
        if (isMonthlyProgram) {
          if (!selectedStartMonth) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`startMonth.${course.id}`],
              message: 'Start month is required',
            });
          }
          if (!selectedEndMonth) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`endMonth.${course.id}`],
              message: 'End month is required',
            });
          }
          if (course.startMonth && selectedStartMonth && selectedStartMonth < course.startMonth) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`startMonth.${course.id}`],
              message: `Start month cannot be before ${course.startMonth}`,
            });
          }
          if (course.endMonth && selectedEndMonth && selectedEndMonth > course.endMonth) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`endMonth.${course.id}`],
              message: `End month cannot be after ${course.endMonth}`,
            });
          }
          if (selectedStartMonth && selectedEndMonth && selectedEndMonth < selectedStartMonth) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`endMonth.${course.id}`],
              message: 'End month cannot be before start month',
            });
          }
        }
      }
    });

    const result = schema.safeParse({
      programId,
      branchId,
      monthlyDiscount,
      oneTimeDiscount,
      admDiscount,
      payNowAmount,
      nextPaymentDueDate,
      paymentMethod,
      selectedCourseCount: selected.length,
    });
    return { success: result.success, errors: collectZodErrors(result) };
  }, [admDiscount, billingStart, branchId, dueAfterPay, isMonthlyProgram, monthlyDiscount, nextPaymentDueDate, oneTimeDiscount, payNowAmount, paymentMethod, program, programId, selCourses, selected, step, totalFee, totalPayable]);
  const canNext = validation.success;

  const toggle = (cid: string) =>
    setSelCourses(p => ({
      ...p,
      [cid]: {
        ...p[cid],
        checked: !p[cid]?.checked,
        // Default start month to the course's own startMonth so billing starts when the course begins,
        // not at the enrollment-level billingStart.
        startMonth: availableCourses.find(c => c.id === cid)?.startMonth ?? billingStart,
        endMonth: p[cid]?.endMonth || availableCourses.find(c => c.id === cid)?.endMonth || availableCourses.find(c => c.id === cid)?.startMonth || billingStart,
      },
    }));
  const setCF = (cid: string, f: string, v: string) =>
    setSelCourses(p => ({ ...p, [cid]: { ...p[cid], [f]: v } }));

  const handleConfirm = async () => {
    if (!validation.success) {
      setEnrollError('Please fix the highlighted enrollment errors before confirming.');
      return;
    }
    setSaving(true);
    setEnrollError('');
    try {
      const coursePayload = selected.map(c => ({
        courseId: c.id,
        batchId: selCourses[c.id]?.batch || null,
        includeBook: false,
        ...(isMonthlyProgram
          ? {
              startMonth: selCourses[c.id]?.startMonth || c.startMonth || billingStart,
              endMonth: selCourses[c.id]?.endMonth || c.endMonth || selCourses[c.id]?.startMonth || c.startMonth || billingStart,
            }
          : {}),
      }));
      const dto: OfflineAdmissionDto = {
        studentUserId: student.id,
        programId,
        courses: coursePayload,
        branchId,
        billingType: isMonthlyProgram ? 'MONTHLY' : 'ONE_TIME',
        ...(isMonthlyProgram
          ? { billingStartMonth: billingStart, monthlyDiscount: Number(monthlyDiscount) || 0 }
          : { oneTimeDiscount: Number(oneTimeDiscount) || 0 }),
        admissionFeeAmountOverrides: program?.admissionFeeEnabled ? { [programId]: admFee } : undefined,
        nextPaymentDueDate: nextDueDatePayload || undefined,
        paymentAmount: payNow > 0 ? payNow : undefined,
        paymentMethod: payNow > 0 ? paymentMethod : undefined,
      };
      const res = await offlineAdmission(dto);
      if (res.success) {
        const pdf = res.data?.pdfUrl || res.data?.invoicePdfUrl;
        if (pdf) window.open(pdf, '_blank');
        onSave({ student, program, netMonthly, admFee });
      } else {
        setEnrollError((res as { message?: string }).message ?? 'Enrollment failed');
      }
    } catch (error) {
      setEnrollError(error instanceof Error ? error.message : 'Enrollment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Enrollment — ${student.fullName}`}
      subtitle={`Reg: ${student.regNo}`}
      maxWidth="max-w-6xl"
    >
      {/* Step tabs */}
      <div className="flex border border-slate-200 rounded-xl overflow-hidden mb-6">
        {['Program & Courses', 'Review & Confirm'].map((s, i) => (
          <div
            key={i}
            onClick={() => step > i + 1 && setStep(i + 1)}
            className={cn(
              'flex-1 px-4 py-3 text-center text-sm font-bold transition-colors',
              i === 0 && 'border-r border-slate-200',
              step === i + 1
                ? 'bg-slate-900 text-white'
                : step > i + 1
                  ? 'bg-indigo-50 text-indigo-700 cursor-pointer'
                  : 'bg-slate-50 text-slate-400',
            )}
          >
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Field label="Program" required>
                <AppSelect
                  value={programId}
                  onChange={v => {
                    setProgramId(v);
                    setSelCourses({});
                    setMonthlyDiscount('0');
                    setOneTimeDiscount('0');
                    setPayNowAmount('0');
                    setNextPaymentDueDate(undefined);
                  }}
                  placeholder="Select program"
                  options={programs.map(p => ({
                    value: p.id,
                    label: enrolledProgramIds.has(p.id) ? `${p.name} (Already Enrolled)` : p.name,
                    disabled: enrolledProgramIds.has(p.id),
                  }))}
                />
                {validation.errors.programId && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.programId}</p>}
              </Field>
              <Field label="Branch">
                <AppSelect
                  value={branchId}
                  onChange={setBranchId}
                  placeholder="Select branch"
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                />
                {validation.errors.branchId && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.branchId}</p>}
              </Field>
            </div>

            {programId && branchId && (
              <div>
                {loadingEnrolled ? (
                  <p className="text-sm text-slate-400 text-center py-6">Checking enrollment status…</p>
                ) : (
                  <>
                    {/* Available (not yet enrolled) courses */}
                    {availableCourses.length > 0 && (() => {
                      const renderCourseCard = (c: Course, noBatch = false) => {
                        const sel = selCourses[c.id];
                        const activeBatches = (courseBatches[c.id] ?? []).filter(b => b.status === 'ACTIVE');
                        return (
                          <div
                            key={c.id}
                            className={cn(
                              'border rounded-xl p-3.5 transition-all',
                              sel?.checked
                                ? 'border-rose-300 bg-rose-50'
                                : noBatch
                                  ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                                  : 'border-slate-200 bg-white hover:border-slate-300',
                            )}
                          >
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!sel?.checked}
                                onChange={() => toggle(c.id)}
                                className="mt-0.5 accent-rose-600"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-bold text-sm text-slate-900">{c.name}</span>
                                  <span className="text-right text-sm">
                                    {effectiveCourseFee(c) < moneyNumber(c.fee) && (
                                      <span className="mr-1 font-semibold text-slate-400 line-through">
                                        {fmt(c.fee)}
                                      </span>
                                    )}
                                    <span className="font-black text-rose-700">
                                      {fmt(effectiveCourseFee(c))}{isMonthlyProgram ? '/month' : ''}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                                  <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                                  {c.type === 'OFFLINE' && !loadingBatches && (
                                    activeBatches.length > 0
                                      ? <AppBadge label={`${activeBatches.length} Batch${activeBatches.length > 1 ? 'es' : ''}`} color="green" />
                                      : <AppBadge label="No Active Batch" color="red" />
                                  )}
                                  <span className="text-xs text-slate-400">
                                    Payment mode: {isMonthlyProgram ? 'monthly' : 'one-time'}
                                  </span>
                                </div>
                              </div>
                            </label>
                            {sel?.checked && (
                              <div className={cn(
                                'grid gap-2.5 mt-3 pt-3 border-t border-dashed',
                                noBatch ? 'border-amber-200' : 'border-rose-200',
                                c.type === 'OFFLINE' && isMonthlyProgram ? 'grid-cols-3' : 'grid-cols-1',
                              )}>
                                {c.type === 'OFFLINE' && (
                                  <Field label="Batch" required>
                                    <AppSelect
                                      value={sel.batch || ''}
                                      onChange={v => setCF(c.id, 'batch', v)}
                                      placeholder="Select batch"
                                      options={(courseBatches[c.id] ?? []).map(b => ({
                                        value: b.id,
                                        label: b.status === 'ACTIVE'
                                          ? b.name
                                          : `${b.name} (${b.status.charAt(0) + b.status.slice(1).toLowerCase()})`,
                                      }))}
                                    />
                                    {(validation.errors[`batch.${c.id}`] || !sel.batch) && (
                                      <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                        {validation.errors[`batch.${c.id}`] || 'Required'}
                                      </p>
                                    )}
                                  </Field>
                                )}
                                {isMonthlyProgram && (
                                  <>
                                    <Field label="Start Month" required>
                                      <MonthInput
                                        value={sel.startMonth || billingStart}
                                        onChange={v => setCF(c.id, 'startMonth', v)}
                                        min={c.startMonth}
                                        max={sel.endMonth || c.endMonth}
                                      />
                                      {validation.errors[`startMonth.${c.id}`] && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                          {validation.errors[`startMonth.${c.id}`]}
                                        </p>
                                      )}
                                    </Field>
                                    <Field label="End Month" required>
                                      <MonthInput
                                        value={sel.endMonth || c.endMonth || sel.startMonth || billingStart}
                                        onChange={v => setCF(c.id, 'endMonth', v)}
                                        min={sel.startMonth || c.startMonth || billingStart}
                                        max={c.endMonth}
                                      />
                                      {validation.errors[`endMonth.${c.id}`] && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                          {validation.errors[`endMonth.${c.id}`]}
                                        </p>
                                      )}
                                    </Field>
                                  </>
                                )}
                              </div>
                            )}
                            {noBatch && !sel?.checked && (
                              <div className="mt-2 flex items-center gap-1.5 text-amber-600">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs font-semibold">No active batch available for this course</span>
                              </div>
                            )}
                          </div>
                        );
                      };
                      return (
                        <>
                          {coursesWithBatches.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Available Courses</p>
                              <div className="flex flex-col gap-2">
                                {coursesWithBatches.map(c => renderCourseCard(c))}
                              </div>
                            </div>
                          )}
                          {coursesNoBatch.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" /> Courses Without Active Batch
                              </p>
                              <div className="flex flex-col gap-2">
                                {coursesNoBatch.map(c => renderCourseCard(c, true))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Already-enrolled courses — shown at bottom, disabled */}
                    {alreadyEnrolledCourses.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Already Enrolled
                        </p>
                        <div className="flex flex-col gap-2 mb-2">
                          {alreadyEnrolledCourses.map(c => (
                            <div
                              key={c.id}
                              className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 opacity-60"
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  disabled
                                  className="mt-0.5 accent-rose-600 cursor-not-allowed"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm text-slate-500">{c.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-slate-400 text-sm">
                                        {fmt(effectiveCourseFee(c))}{isMonthlyProgram ? '/month' : ''}
                                      </span>
                                      <AppBadge label="Already Enrolled" color="slate" />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                                    <span className="text-xs text-slate-400">
                                      Payment mode: {isMonthlyProgram ? 'monthly' : 'one-time'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All enrolled or no courses */}
                    {availableCourses.length === 0 && alreadyEnrolledCourses.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2 items-start mt-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 font-semibold">
                          All courses in this program are already enrolled.
                        </p>
                      </div>
                    )}
                    {availableCourses.length === 0 && alreadyEnrolledCourses.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-5">No courses found in this program.</p>
                    )}
                  </>
                )}
              </div>
            )}
            {programId && !branchId && (
              <div className="border border-dashed border-slate-200 rounded-xl px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Select branch to load course list</p>
                <p className="text-xs text-slate-400 mt-1">Courses will appear after both program and branch are selected.</p>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5">Admission Summary</p>
              {selected.length > 0 ? (
                <>
                  <ul className="list-decimal pl-4 mb-3.5 space-y-1">
                    {selected.map(c => (
                      <li key={c.id} className="text-sm text-slate-900 font-semibold">{c.name}</li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-200 pt-3 space-y-1.5">
                    {[['Course fee', fmt(grossCourseTotal)], ['Promotional discount', promotionalDiscount > 0 ? `−${fmt(promotionalDiscount)}` : '৳0']].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-sm text-slate-500">{k}</span>
                        <span className={cn('text-sm font-semibold text-slate-900', k === 'Promotional discount' && promotionalDiscount > 0 && 'text-emerald-700')}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-slate-200 mb-1">
                      <span className="text-sm font-bold text-slate-900">Sub-total</span>
                      <span className="text-sm font-black text-slate-900">{fmt(totalFee)}</span>
                    </div>
                  </div>

                  {isMonthlyProgram && (
                    <>
                      <Field label="Monthly Scholarship">
                        <Input
                          type="number"
                          min={0}
                          max={totalFee}
                          value={monthlyDiscount}
                          onChange={e => setMonthlyDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                        {validation.errors.monthlyDiscount && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.monthlyDiscount}</p>
                        )}
                      </Field>
                      <Field label="Billing Start Month">
                        <MonthInput value={billingStart} onChange={setBillingStart} />
                      </Field>
                      <div className="bg-white border-2 border-rose-200 rounded-xl px-3.5 py-2.5 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">Total (monthly fee)</span>
                          <span className="font-black text-base text-rose-700">{fmt(netMonthly)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {!isMonthlyProgram && (
                    <>
                      <Field label="One-time Discount">
                        <Input
                          type="number"
                          min={0}
                          max={totalFee}
                          value={oneTimeDiscount}
                          onChange={e => setOneTimeDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                        {validation.errors.oneTimeDiscount && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.oneTimeDiscount}</p>
                        )}
                      </Field>
                      <div className="bg-white border-2 border-rose-200 rounded-xl px-3.5 py-2.5 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">Total (one-time fee)</span>
                          <span className="font-black text-base text-rose-700">{fmt(oneTimeCoursePayable)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {program?.admissionFeeEnabled && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-500">Admission fee</span>
                        <span className="font-bold text-sm">{fmt(program.admissionFeeAmount)}</span>
                      </div>
                      <Field label="Discount on admission fee">
                        <Input
                          type="number"
                          min={0}
                          max={program.admissionFeeAmount}
                          value={admDiscount}
                          onChange={e => setAdmDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                        {validation.errors.admDiscount && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.admDiscount}</p>
                        )}
                      </Field>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-slate-900">Admission fee payment</span>
                        <span className="font-black text-rose-700">{fmt(admFee)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-sm text-slate-400">Select courses to see summary</p>
                  {validation.errors.selectedCourseCount && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.selectedCourseCount}</p>
                  )}
                </div>
              )}
            </div>
            <Button
              className="w-full gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
              disabled={!canNext}
              onClick={() => setStep(2)}
            >
              Review & Confirm →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 flex gap-2.5">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-800">Review enrollment details before confirming</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Once confirmed, invoices will be generated automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 mb-5">
            {[
              ['Student', student.fullName],
              ['Program', program?.name ?? ''],
              ['Billing', program?.paymentCircle ?? ''],
              ['Start Month', billingStart],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="font-bold text-sm text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Course', 'Type', 'Batch', 'Fee', 'Discount', 'Net Fee'].map(h => (
                    <th
                      key={h}
                      className={cn(
                        'px-3.5 py-2.5 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200',
                        ['Course', 'Type', 'Batch'].includes(h) ? 'text-left' : 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributed.map(c => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-3.5 py-3 font-bold text-slate-900">{c.name}</td>
                    <td className="px-3.5 py-3">
                      <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                    </td>
                    <td className="px-3.5 py-3 text-slate-500">
                      {courseBatches[c.id]?.find(b => b.id === selCourses[c.id]?.batch)?.name || '—'}
                    </td>
                    <td className="px-3.5 py-3 text-right font-semibold">{fmt(c.fee)}</td>
                    <td className="px-3.5 py-3 text-right text-rose-500 font-semibold">
                      {c.discount > 0 ? `−${fmt(c.discount)}` : '—'}
                    </td>
                    <td className="px-3.5 py-3 text-right font-black text-rose-700">{fmt(c.fee - c.discount)}</td>
                  </tr>
                ))}
                <tr className="bg-rose-50 border-t-2 border-rose-200">
                  <td colSpan={3} className="px-3.5 py-3 font-black text-slate-900">
                    {isMonthlyProgram ? 'Total Monthly Payable' : 'Total Payable'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-bold">{fmt(totalFee)}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-rose-500">
                    {activeDiscount > 0 ? `−${fmt(activeDiscount)}` : '—'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-black text-rose-700 text-base">
                    {fmt(coursePayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {program?.admissionFeeEnabled && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">Admission Fee (one-time)</span>
              <span className="font-black text-lg text-rose-700">{fmt(admFee)}</span>
            </div>
          )}

          <div className="grid grid-cols-[1fr_320px] gap-4 mb-5">
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payment at Admission</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'No payment', value: 0 },
                  { label: 'Admission only', value: admFee, disabled: admFee <= 0 },
                  { label: 'Full payment', value: totalPayable },
                ].map(option => (
                  <button
                    key={option.label}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => setPayNowAmount(String(Math.min(option.value, totalPayable)))}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs font-bold transition-colors',
                      option.disabled
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Field label="Pay Now Amount">
                <Input
                  type="number"
                  min={0}
                  max={totalPayable}
                  value={payNowAmount}
                  onChange={e => {
                    const next = Number(e.target.value) || 0;
                    setPayNowAmount(next > totalPayable ? String(totalPayable) : e.target.value);
                  }}
                  className="text-right focus-visible:ring-indigo-400"
                />
                {validation.errors.payNowAmount && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.payNowAmount}</p>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {(['CASH', 'BKASH'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    disabled={payNow <= 0}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm font-bold transition-colors',
                      paymentMethod === method && payNow > 0
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      payNow <= 0 && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {method === 'CASH' ? 'Cash' : 'bKash'}
                  </button>
                ))}
              </div>
              {needsNextDueDate && (
                <Field label="Next Due Date" required>
                  <DatePicker
                    date={nextPaymentDueDate}
                    setDate={setNextPaymentDueDate}
                    placeholder="Pick next due date"
                  />
                  {validation.errors.nextPaymentDueDate && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.nextPaymentDueDate}</p>
                  )}
                </Field>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Preview</p>
              {[
                ['Total payable', fmt(totalPayable)],
                ['Pay now', fmt(payNow)],
                ['Due after admission', fmt(dueAfterPay)],
                ...(needsNextDueDate && nextPaymentDueDate ? [['Next due date', nextDueDateLabel]] : []),
                ['Invoice status', payNow <= 0 ? 'ISSUED' : dueAfterPay > 0 ? 'PARTIAL' : 'PAID'],
                ['Enrollment status', payNow > 0 ? 'ACTIVE' : 'PENDING_PAYMENT'],
                ['Access status', accessPreview],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-slate-200 last:border-0">
                  <span className="text-sm text-slate-500">{k}</span>
                  <span className="text-sm font-black text-slate-900 text-right">{v}</span>
                </div>
              ))}
              {payNow > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Payment Distribution
                  </p>
                  {paymentDistributionPreview.admissionDue > 0 && (
                    <div className="flex justify-between gap-3 rounded-lg bg-white px-2.5 py-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">Admission fee</span>
                      <span className="text-xs font-black text-slate-900">
                        {fmt(paymentDistributionPreview.admissionApplied)}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {paymentDistributionPreview.courseAllocations.map(row => (
                      <div key={row.id} className="rounded-lg bg-white px-2.5 py-2">
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0 truncate text-xs font-semibold text-slate-600">{row.name}</span>
                          <span className="shrink-0 text-xs font-black text-slate-900">{fmt(row.applied)}</span>
                        </div>
                        <div className="mt-0.5 flex justify-between gap-3 text-[11px] text-slate-400">
                          <span>Due before {fmt(row.due)}</span>
                          <span>After {fmt(row.dueAfter)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {dueAfterPay > 0 && (
                    <p className="mt-2 flex gap-1.5 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Partial payment leaves {fmt(dueAfterPay)} due after admission. 
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
            {enrollError && <p className="text-sm text-rose-600 font-semibold self-center">{enrollError}</p>}
            <Button
              onClick={handleConfirm}
              disabled={saving || !validation.success}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Check className="h-4 w-4" /> {saving ? 'Processing…' : 'Confirm Admission'}
            </Button>
          </div>
        </div>
      )}
    </AppModal>
  );
}
