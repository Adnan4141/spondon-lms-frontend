'use client';

import { useEffect, useMemo, useState } from 'react';
import { format as formatDate } from 'date-fns';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments, offlineAdmission, type OfflineAdmissionDto } from '@/lib/api/enrollments';
import type { Course, Program, SelCourseState } from '../../types';
import { currentMonth, distributeDiscount } from '../../utils';
import type { EnrollmentModalProps } from '../enrollment-modal-types';
import {
  defaultEnrollmentCourseMonths,
  distributeEqualCents,
  effectiveCourseFee,
  maxMonth,
  moneyNumber,
  roundMoney,
} from '../enrollment-modal-utils';
import { validateEnrollment } from '../enrollment-modal-validation';

export function useEnrollmentModal({
  student,
  programs,
  allCourses,
  branches,
  onSave,
}: EnrollmentModalProps) {
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
  const [courseBatches, setCourseBatches] = useState<
    Record<string, { id: string; name: string; status: string }[]>
  >({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<Set<string>>(new Set());
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  useEffect(() => {
    getEnrollments({ studentUserId: student.id, limit: 50 })
      .then((res) => {
        if (res.success && res.data) {
          setEnrolledProgramIds(new Set(res.data.map((e) => e.programId)));
        }
      })
      .catch(() => {
        setEnrolledProgramIds(new Set());
      });
  }, [student.id]);

  useEffect(() => {
    if (student.branchId) {
      setBranchId(student.branchId);
      return;
    }
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
    setSelCourses((prev) => {
      const next: Record<string, SelCourseState> = {};
      Object.entries(prev).forEach(([courseId, meta]) => {
        next[courseId] = { ...meta, batch: '' };
      });
      return next;
    });
  }, [branchId]);

  useEffect(() => {
    if (!programId || !branchId) {
      setCourseBatches({});
      return;
    }
    setCourseBatches({});
    setLoadingBatches(true);
    getBatches({ programId, branchId: branchId || undefined, status: 'ACTIVE', limit: 200, all: true })
      .then((res) => {
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

  useEffect(() => {
    if (!programId) {
      setEnrolledCourseIds(new Set());
      return;
    }
    setLoadingEnrolled(true);
    getEnrollments({ studentUserId: student.id, limit: 50 })
      .then((res) => {
        if (res.success && res.data) {
          const ids = new Set(
            res.data
              .filter((e) => e.programId === programId)
              .flatMap((e) => (e.enrollmentCourses ?? []).map((ec: { courseId: string }) => ec.courseId)),
          );
          setEnrolledCourseIds(ids);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEnrolled(false));
  }, [programId, student.id]);

  const program = programs.find((p) => p.id === programId);
  const isMonthlyProgram = program?.paymentCircle === 'MONTHLY';
  const courses = programId ? allCourses.filter((c) => c.programId === programId) : [];
  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));
  const alreadyEnrolledCourses = courses.filter((c) => enrolledCourseIds.has(c.id));
  const coursesWithBatches = loadingBatches
    ? availableCourses
    : availableCourses.filter(
        (c) => c.type === 'ONLINE' || courseBatches[c.id]?.some((b) => b.status === 'ACTIVE'),
      );
  const coursesNoBatch = loadingBatches
    ? []
    : availableCourses.filter(
        (c) => c.type === 'OFFLINE' && !courseBatches[c.id]?.some((b) => b.status === 'ACTIVE'),
      );
  const selected = availableCourses.filter((c) => selCourses[c.id]?.checked);
  const grossCourseTotal = selected.reduce((s, c) => s + moneyNumber(c.fee), 0);
  const totalFee = selected.reduce((s, c) => s + effectiveCourseFee(c), 0);
  const promotionalDiscount = Math.max(0, grossCourseTotal - totalFee);
  const activeDiscount = isMonthlyProgram ? Number(monthlyDiscount) || 0 : Number(oneTimeDiscount) || 0;
  const selectedEffectiveCourses = selected.map((c) => ({ ...c, fee: effectiveCourseFee(c) }));
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
  const nextDueDatePayload =
    needsNextDueDate && nextPaymentDueDate ? formatDate(nextPaymentDueDate, 'yyyy-MM-dd') : '';
  const nextDueDateLabel = nextPaymentDueDate ? formatDate(nextPaymentDueDate, 'dd-MM-yyyy') : '';
  const accessPreview = payNow > 0 ? 'FULL_ACCESS' : 'NO_ACCESS';

  const paymentDistributionPreview = useMemo(() => {
    const admissionApplied = roundMoney(Math.min(admFee, payNow));
    const remainingAfterAdmission = roundMoney(Math.max(0, payNow - admissionApplied));
    const courseRows = distributed.map((course) => ({
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

  const validation = useMemo(
    () =>
      validateEnrollment(
        {
          programId,
          branchId,
          monthlyDiscount,
          oneTimeDiscount,
          admDiscount,
          payNowAmount,
          nextPaymentDueDate,
          paymentMethod,
          selectedCourseCount: selected.length,
        },
        {
          step,
          isMonthlyProgram,
          program,
          selected,
          selCourses,
          billingStart,
          totalFee,
          totalPayable,
          dueAfterPay,
        },
      ),
    [
      admDiscount,
      billingStart,
      branchId,
      dueAfterPay,
      isMonthlyProgram,
      monthlyDiscount,
      nextPaymentDueDate,
      oneTimeDiscount,
      payNowAmount,
      paymentMethod,
      program,
      programId,
      selCourses,
      selected,
      step,
      totalFee,
      totalPayable,
    ],
  );

  const canNext = validation.success;

  const resetProgramSelection = (v: string) => {
    setProgramId(v);
    setSelCourses({});
    setMonthlyDiscount('0');
    setOneTimeDiscount('0');
    setPayNowAmount('0');
    setNextPaymentDueDate(undefined);
  };

  const toggle = (cid: string) => {
    const course = availableCourses.find((c) => c.id === cid);
    const defaults = course ? defaultEnrollmentCourseMonths(course, billingStart) : null;
    setSelCourses((p) => ({
      ...p,
      [cid]: {
        ...p[cid],
        checked: !p[cid]?.checked,
        startMonth: defaults?.startMonth ?? billingStart,
        endMonth: defaults?.endMonth ?? billingStart,
      },
    }));
  };

  const setCF = (cid: string, f: string, v: string) =>
    setSelCourses((p) => ({ ...p, [cid]: { ...p[cid], [f]: v } }));

  const handleBillingStartChange = (next: string) => {
    setBillingStart(next);
    setSelCourses((prev) => {
      let changed = false;
      const updated = { ...prev };
      for (const [courseId, meta] of Object.entries(updated)) {
        if (!meta?.checked) continue;
        const course = availableCourses.find((c) => c.id === courseId);
        const minStart = course
          ? defaultEnrollmentCourseMonths(course, next).startMonth
          : next;
        const nextStart = maxMonth(meta.startMonth, minStart);
        const nextEnd = meta.endMonth && meta.endMonth >= nextStart
          ? meta.endMonth
          : course
            ? defaultEnrollmentCourseMonths(course, next).endMonth
            : nextStart;
        if (nextStart !== meta.startMonth || nextEnd !== meta.endMonth) {
          updated[courseId] = { ...meta, startMonth: nextStart, endMonth: nextEnd };
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  };

  const handleConfirm = async () => {
    if (!validation.success) {
      setEnrollError('Please fix the highlighted enrollment errors before confirming.');
      return;
    }
    setSaving(true);
    setEnrollError('');
    try {
      const coursePayload = selected.map((c) => ({
        courseId: c.id,
        batchId: selCourses[c.id]?.batch || null,
        includeBook: false,
        ...(isMonthlyProgram
          ? (() => {
              const months = defaultEnrollmentCourseMonths(c, billingStart);
              return {
                startMonth: selCourses[c.id]?.startMonth || months.startMonth,
                endMonth: selCourses[c.id]?.endMonth || months.endMonth,
              };
            })()
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

  return {
    student,
    step,
    setStep,
    programId,
    setProgramId: resetProgramSelection,
    branchId,
    setBranchId,
    programs,
    branches,
    enrolledProgramIds,
    selCourses,
    monthlyDiscount,
    setMonthlyDiscount,
    oneTimeDiscount,
    setOneTimeDiscount,
    admDiscount,
    setAdmDiscount,
    payNowAmount,
    setPayNowAmount,
    paymentMethod,
    setPaymentMethod,
    nextPaymentDueDate,
    setNextPaymentDueDate,
    billingStart,
    setBillingStart: handleBillingStartChange,
    courseBatches,
    loadingBatches,
    saving,
    enrollError,
    loadingEnrolled,
    program,
    isMonthlyProgram,
    availableCourses,
    alreadyEnrolledCourses,
    coursesWithBatches,
    coursesNoBatch,
    selected,
    grossCourseTotal,
    totalFee,
    promotionalDiscount,
    activeDiscount,
    distributed,
    netMonthly,
    oneTimeCoursePayable,
    admFee,
    coursePayable,
    totalPayable,
    payNow,
    dueAfterPay,
    needsNextDueDate,
    nextDueDateLabel,
    accessPreview,
    paymentDistributionPreview,
    validation,
    canNext,
    toggle,
    setCF,
    handleConfirm,
  };
}

export type EnrollmentModalController = ReturnType<typeof useEnrollmentModal>;
