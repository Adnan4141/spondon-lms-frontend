'use client';

import { useEffect, useMemo, useState } from 'react';
import { getBatches } from '@/lib/api/batches';
import { getInvoicePdfUrl } from '@/lib/api/invoices';
import {
  applyMonthlyEnrollmentChanges,
  correctionResetEnrollment,
} from '@/lib/api/enrollments';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '../../types';
import { currentMonth, fmt, fmtMonth, normPdfUrl } from '../../utils';
import {
  defaultCourseMeta,
  getCourseTimelineError,
  type CourseMeta,
  type ManageEnrollmentModalProps,
  type ManageEnrollmentResult,
  type ManageEnrollmentStep,
} from '../manage-enrollment-modal-utils';

export function useManageEnrollmentModal({
  enrollment,
  allCourses,
  programs,
  studentUserId,
  initialCancelCourseId,
  onClose,
  onDone,
}: ManageEnrollmentModalProps) {
  const [step, setStep] = useState<ManageEnrollmentStep>('select');
  const [selectedAddCourseIds, setSelectedAddCourseIds] = useState<string[]>([]);
  const [selectedCancelCourseIds, setSelectedCancelCourseIds] = useState<string[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, CourseMeta>>({});
  const [courseBatches, setCourseBatches] = useState<
    Record<string, { id: string; name: string; status: string }[]>
  >({});
  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState('Applying changes...');
  const [submitError, setSubmitError] = useState('');
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(enrollment.monthlyDiscount);
  const [effectiveMonth, setEffectiveMonth] = useState(() => currentMonth());
  const [result, setResult] = useState<ManageEnrollmentResult | null>(null);
  const [correctionMode, setCorrectionMode] = useState<'discount' | 'restore' | 'both'>('discount');
  const [correctionDiscount, setCorrectionDiscount] = useState(String(enrollment.monthlyDiscount ?? 0));
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionBusy, setCorrectionBusy] = useState(false);

  const effMonth = effectiveMonth;
  const { toast, toasts, removeToast } = useToast();
  const program = programs.find((p) => p.id === enrollment.programId);

  const activeCourses = useMemo(
    () =>
      enrollment.courses
        .filter((ec) => ec.status === 'ACTIVE')
        .map((ec) => allCourses.find((c) => c.id === ec.courseId))
        .filter((c): c is Course => Boolean(c)),
    [allCourses, enrollment.courses],
  );

  const activeCourseIds = activeCourses.map((c) => c.id);
  const availableCourses = allCourses.filter(
    (c) => c.programId === enrollment.programId && !activeCourseIds.includes(c.id),
  );
  const selectedAddCourses = availableCourses.filter((c) => selectedAddCourseIds.includes(c.id));
  const selectedCancelCourses = activeCourses.filter((c) => selectedCancelCourseIds.includes(c.id));
  const cancelledCourseCount = enrollment.courses.filter(
    (ec) => ec.status === 'CANCELLED' || ec.cancelEffectiveMonth,
  ).length;

  const projectedCourses = [
    ...activeCourses.filter((c) => !selectedCancelCourseIds.includes(c.id)),
    ...selectedAddCourses,
  ];

  const hasChanges = selectedAddCourses.length > 0 || selectedCancelCourses.length > 0;
  const hasInvalidBatch = selectedAddCourses.some(
    (c) => c.type === 'OFFLINE' && !selectedMeta[c.id]?.batch,
  );
  const hasInvalidTimeline = selectedAddCourses.some((course) => {
    const meta = selectedMeta[course.id] || defaultCourseMeta(course, effMonth);
    return Boolean(getCourseTimelineError(course, meta, effMonth));
  });
  const projectedCount =
    activeCourses.length - selectedCancelCourses.length + selectedAddCourses.length;
  const willAutoCancelEnrollment = projectedCount <= 0 && selectedCancelCourses.length > 0;
  const invalidFinalState = projectedCount < 0;
  const canProceed = hasChanges && !hasInvalidBatch && !hasInvalidTimeline && !invalidFinalState;

  const triggerType: 'REMOVE' | 'ADD' =
    selectedCancelCourses.length > 0 && selectedAddCourses.length === 0 ? 'REMOVE' : 'ADD';
  const changedCourse = selectedAddCourses[0] || selectedCancelCourses[0] || activeCourses[0];

  useEffect(() => {
    if (!initialCancelCourseId) return;
    if (!activeCourseIds.includes(initialCancelCourseId)) return;
    setSelectedCancelCourseIds((prev) =>
      prev.includes(initialCancelCourseId) ? prev : [...prev, initialCancelCourseId],
    );
  }, [activeCourseIds, initialCancelCourseId]);

  useEffect(() => {
    selectedAddCourseIds.forEach((cid) => {
      if (courseBatches[cid]) return;
      getBatches({ courseId: cid, branchId: enrollment.branchId, status: 'ACTIVE', limit: 100 })
        .then((res) => {
          if (!res.success || !res.data) return;
          const batches = res.data!.map((b) => ({
            id: b.id,
            name: b.name,
            status: b.status as string,
          }));
          setCourseBatches((prev) => ({ ...prev, [cid]: batches }));
          setSelectedMeta((prev) => {
            const current = prev[cid];
            if (!current?.batch || batches.some((batch) => batch.id === current.batch)) return prev;
            return { ...prev, [cid]: { ...current, batch: '' } };
          });
        })
        .catch(() => {
          setCourseBatches((prev) => ({ ...prev, [cid]: [] }));
          setSelectedMeta((prev) =>
            prev[cid]?.batch ? { ...prev, [cid]: { ...prev[cid], batch: '' } } : prev,
          );
        });
    });
  }, [selectedAddCourseIds, courseBatches, enrollment.branchId]);

  const handleApply = async (discount: number) => {
    if (!hasChanges || !canProceed) return;

    setSaving(true);
    setSubmitError('');
    setProgressText('Applying enrollment changes...');

    try {
      const res = await applyMonthlyEnrollmentChanges(enrollment.id, {
        effectiveMonth: effMonth,
        removeCourseIds: selectedCancelCourses.map((c) => c.id),
        addCourses: selectedAddCourses.map((c) => {
          const meta = selectedMeta[c.id] || defaultCourseMeta(c, effMonth);
          return {
            courseId: c.id,
            batchId: meta.batch || null,
            includeBook: false,
            startMonth: meta.startMonth,
            endMonth: meta.endMonth,
          };
        }),
        monthlyDiscount: discount !== enrollment.monthlyDiscount ? discount : undefined,
        reason: 'Monthly enrollment changes from Manage Enrollment',
        advanceMonths: 3,
      });

      if (!res.success || !res.data) {
        throw new Error((res as { message?: string }).message ?? 'Failed to update enrollment');
      }

      const { added, removed, invoiceRefresh, previewInvoiceId } = res.data;
      const failures = [
        ...invoiceRefresh.failedMonths.map((month) => `Invoice regen failed: ${month}`),
        ...invoiceRefresh.advanceErrors,
      ];

      if (previewInvoiceId) {
        const pdfRes = await getInvoicePdfUrl(previewInvoiceId);
        if (pdfRes?.data?.pdfUrl) setInvoicePdfUrl(normPdfUrl(pdfRes.data.pdfUrl));
      }

      setAppliedDiscount(discount);

      if (added === 0 && removed === 0) {
        setSubmitError('No changes were applied. Please review your selections and try again.');
        return;
      }

      if (failures.length) {
        setSubmitError(`Some updates failed: ${failures.join(' | ')}`);
      }

      setResult({ added, removed, failed: failures.length, effectiveMonth: effMonth });
      setStep('success');
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? 'Failed to update enrollment');
    } finally {
      setSaving(false);
      setProgressText('Applying changes...');
    }
  };

  const handleCorrectionReset = async () => {
    const trimmedReason = correctionReason.trim();
    const shouldFixDiscount = correctionMode === 'discount' || correctionMode === 'both';
    const shouldRestore = correctionMode === 'restore' || correctionMode === 'both';
    const nextDiscount = Number(correctionDiscount);

    if (!trimmedReason) {
      toast({
        title: 'Reason required',
        description: 'Write why this correction is needed.',
        variant: 'destructive',
      });
      return;
    }
    if (shouldFixDiscount && (!Number.isFinite(nextDiscount) || nextDiscount < 0)) {
      toast({
        title: 'Invalid discount',
        description: 'Discount must be zero or greater.',
        variant: 'destructive',
      });
      return;
    }
    if (shouldRestore && cancelledCourseCount === 0) {
      toast({
        title: 'No cancelled courses',
        description: 'There are no cancelled courses to restore.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = await confirmAction({
      title: 'Confirm enrollment correction',
      description: [
        `Effective month: ${fmtMonth(effMonth)}.`,
        shouldFixDiscount ? `Monthly discount will become ${fmt(nextDiscount)}.` : null,
        shouldRestore ? `${cancelledCourseCount} cancelled course(s) may be restored.` : null,
        'Open invoices will be recalculated; paid months will use settlements instead of rewriting history.',
        `Reason: ${trimmedReason}`,
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: 'Apply Correction',
      cancelLabel: 'Review Again',
      variant: 'warning',
    });
    if (!confirmed) return;

    setCorrectionBusy(true);
    try {
      const res = await correctionResetEnrollment(enrollment.id, {
        reason: trimmedReason,
        effectiveMonth: effMonth,
        monthlyDiscount: shouldFixDiscount ? nextDiscount : undefined,
        restoreCancelledCourses: shouldRestore,
      });
      if (!res.success || !res.data) {
        throw new Error((res as { message?: string }).message || 'Correction failed');
      }
      toast({
        title: 'Correction applied',
        description: `${res.data.restoredCourses} restored, ${res.data.recalculatedInvoices} invoice(s) recalculated.`,
        variant: 'success',
      });
      setAppliedDiscount(shouldFixDiscount ? nextDiscount : appliedDiscount);
      onDone({
        added: 0,
        removed: 0,
        failed: res.data.invoiceRefreshFailedMonths?.length ?? 0,
        effectiveMonth: effMonth,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Correction failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setCorrectionBusy(false);
    }
  };

  const toggleAddCourse = (c: Course, checked: boolean) => {
    setSelectedAddCourseIds((prev) =>
      checked ? prev.filter((id) => id !== c.id) : [...prev, c.id],
    );
    if (!checked) {
      setSelectedMeta((prev) => ({
        ...prev,
        [c.id]: {
          ...defaultCourseMeta(c, effMonth),
          batch: prev[c.id]?.batch || '',
        },
      }));
    }
  };

  const updateCourseMeta = (courseId: string, meta: CourseMeta) => {
    setSelectedMeta((prev) => ({ ...prev, [courseId]: meta }));
  };

  const toggleCancelCourse = (courseId: string, checked: boolean) => {
    setSelectedCancelCourseIds((prev) =>
      checked ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const finishSuccess = () => {
    if (result) onDone(result);
    onClose();
  };

  return {
    enrollment,
    program,
    step,
    setStep,
    saving,
    submitError,
    progressText,
    effectiveMonth,
    setEffectiveMonth,
    effMonth,
    toasts,
    removeToast,
    correctionMode,
    setCorrectionMode,
    correctionDiscount,
    setCorrectionDiscount,
    correctionReason,
    setCorrectionReason,
    correctionBusy,
    cancelledCourseCount,
    availableCourses,
    activeCourses,
    selectedAddCourseIds,
    selectedCancelCourseIds,
    selectedMeta,
    courseBatches,
    selectedAddCourses,
    selectedCancelCourses,
    projectedCount,
    willAutoCancelEnrollment,
    canProceed,
    projectedCourses,
    triggerType,
    changedCourse,
    handleApply,
    handleCorrectionReset,
    toggleAddCourse,
    updateCourseMeta,
    toggleCancelCourse,
    result,
    appliedDiscount,
    invoicePdfUrl,
    onClose,
    finishSuccess,
  };
}

export type ManageEnrollmentModalController = ReturnType<typeof useManageEnrollmentModal>;
