'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getBatches } from '@/lib/api/batches';
import { getInvoicePdfUrl, getInvoices } from '@/lib/api/invoices';
import {
  applyOneTimeEnrollmentChanges,
  getOneTimeEnrollmentPreview,
  previewOneTimeEnrollmentChanges,
  type OneTimeEnrollmentPreview,
  type OneTimePreviewChanges,
} from '@/lib/api/enrollments';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import type { Course } from '../../types';
import { fmt, normPdfUrl } from '../../utils';
import type {
  ManageOneTimeEnrollmentModalProps,
  ManageOneTimeResult,
  ManageOneTimeStep,
} from '../manage-one-time-enrollment-utils';

type PreviewCourse = Pick<Course, 'id' | 'name' | 'fee' | 'type' | 'programId'> & {
  startMonth?: string | null;
  endMonth?: string | null;
  hasBooks?: boolean;
  bookPrice?: number;
};

export function useManageOneTimeEnrollment({
  enrollment,
  programs,
  studentUserId,
  initialCancelCourseId,
  onClose,
  onDone,
}: ManageOneTimeEnrollmentModalProps) {
  const [step, setStep] = useState<ManageOneTimeStep>('select');
  const [preview, setPreview] = useState<OneTimeEnrollmentPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [feePreview, setFeePreview] = useState<OneTimePreviewChanges | null>(null);
  const [loadingFeePreview, setLoadingFeePreview] = useState(false);
  const [selectedAddCourseIds, setSelectedAddCourseIds] = useState<string[]>([]);
  const [selectedCancelCourseIds, setSelectedCancelCourseIds] = useState<string[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { batch: string; includeBook?: boolean }>>({});
  const [courseBatches, setCourseBatches] = useState<
    Record<string, { id: string; name: string; status: string }[]>
  >({});
  const [reason, setReason] = useState('');
  const [oneTimeDiscountInput, setOneTimeDiscountInput] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<ManageOneTimeResult | null>(null);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);

  const program = programs.find((p) => p.id === enrollment.programId);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await getOneTimeEnrollmentPreview(enrollment.id);
      if (res.success && res.data) {
        setPreview(res.data);
        setOneTimeDiscountInput(String(res.data.enrollment.oneTimeDiscount ?? 0));
      } else {
        setPreview(null);
        setPreviewError((res as { message?: string }).message ?? 'Could not load enrollment preview');
      }
    } catch (err) {
      setPreview(null);
      setPreviewError(err instanceof Error ? err.message : 'Could not load enrollment preview');
    } finally {
      setLoadingPreview(false);
    }
  }, [enrollment.id]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const activeCourses: PreviewCourse[] = (preview?.activeCourses ?? []).map((c) => ({
    id: c.courseId,
    name: c.name,
    fee: c.fee,
    type: c.type as Course['type'],
    programId: enrollment.programId,
  }));

  const availableCourses: PreviewCourse[] = (preview?.availableCourses ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    fee: c.fee,
    type: c.type as Course['type'],
    programId: enrollment.programId,
    startMonth: c.startMonth,
    endMonth: c.endMonth,
    hasBooks: c.hasBooks,
    bookPrice: c.bookPrice,
  }));

  const activeCourseIds = activeCourses.map((c) => c.id);
  const selectedAddCourses = availableCourses.filter((c) => selectedAddCourseIds.includes(c.id));
  const selectedCancelCourses = activeCourses.filter((c) => selectedCancelCourseIds.includes(c.id));

  const parsedDiscount = Number(oneTimeDiscountInput);
  const discountChanged =
    preview != null &&
    Number.isFinite(parsedDiscount) &&
    parsedDiscount !== Number(preview.enrollment.oneTimeDiscount ?? 0);

  const needsNextDueDate =
    Boolean(preview?.invoiceState.isFullyPaid) && selectedAddCourses.length > 0;

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
          const batches = res.data.map((b) => ({
            id: b.id,
            name: b.name,
            status: b.status as string,
          }));
          setCourseBatches((prev) => ({ ...prev, [cid]: batches }));
        })
        .catch(() => {
          setCourseBatches((prev) => ({ ...prev, [cid]: [] }));
        });
    });
  }, [selectedAddCourseIds, courseBatches, enrollment.branchId]);

  useEffect(() => {
    const hasSelection =
      selectedAddCourseIds.length > 0 || selectedCancelCourseIds.length > 0 || discountChanged;
    if (!preview || !hasSelection) {
      setFeePreview(null);
      return;
    }

    let cancelled = false;
    setLoadingFeePreview(true);
    void previewOneTimeEnrollmentChanges(enrollment.id, {
      removeCourseIds: selectedCancelCourseIds,
      addCourses: selectedAddCourseIds.map((courseId) => ({
        courseId,
        includeBook: selectedMeta[courseId]?.includeBook === true,
      })),
      oneTimeDiscount: Number.isFinite(parsedDiscount) ? parsedDiscount : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setFeePreview(res.success && res.data ? res.data : null);
      })
      .catch(() => {
        if (!cancelled) setFeePreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingFeePreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    preview,
    enrollment.id,
    selectedAddCourseIds,
    selectedCancelCourseIds,
    selectedMeta,
    discountChanged,
    parsedDiscount,
  ]);

  const actions = preview?.allowedActions;
  const isBlocked = Boolean(actions?.blockReason) && !actions?.canAdd && !actions?.canRemove;

  const hasChanges =
    selectedAddCourses.length > 0 || selectedCancelCourses.length > 0 || discountChanged;
  const hasInvalidBatch = selectedAddCourses.some(
    (c) => c.type === 'OFFLINE' && !selectedMeta[c.id]?.batch,
  );
  const hasInvalidDiscount = discountChanged && (!Number.isFinite(parsedDiscount) || parsedDiscount < 0);
  const hasInvalidDueDate = needsNextDueDate && !nextPaymentDueDate;
  const projectedCount =
    activeCourses.length - selectedCancelCourses.length + selectedAddCourses.length;
  const willAutoCancelEnrollment = projectedCount <= 0 && selectedCancelCourses.length > 0;

  const canProceed =
    hasChanges &&
    !hasInvalidBatch &&
    !hasInvalidDiscount &&
    !hasInvalidDueDate &&
    !isBlocked &&
    projectedCount >= 0 &&
    (selectedAddCourses.length === 0 || actions?.canAdd !== false) &&
    (selectedCancelCourses.length === 0 || actions?.canRemove !== false);

  const addFeeDelta = feePreview?.addGross ?? selectedAddCourses.reduce((sum, c) => sum + c.fee, 0);
  const removeFeeDelta = feePreview?.removeGross ?? selectedCancelCourses.reduce((sum, c) => sum + c.fee, 0);

  const resolveInvoicePdf = async (invoiceId?: string | null) => {
    if (invoiceId) {
      const pdfRes = await getInvoicePdfUrl(invoiceId);
      if (pdfRes?.data?.pdfUrl) {
        setInvoicePdfUrl(normPdfUrl(pdfRes.data.pdfUrl));
        return;
      }
    }

    const invoicesRes = await getInvoices({ studentUserId, limit: 20 });
    if (!invoicesRes.success || !invoicesRes.data) return;
    const oneTimeInv =
      invoicesRes.data.find((inv) => inv.month == null && inv.status !== 'CANCELLED') ??
      invoicesRes.data.find((inv) => inv.status !== 'CANCELLED');
    if (!oneTimeInv?.id) return;
    const pdfRes = await getInvoicePdfUrl(oneTimeInv.id);
    if (pdfRes?.data?.pdfUrl) setInvoicePdfUrl(normPdfUrl(pdfRes.data.pdfUrl));
  };

  const handleApply = async () => {
    if (!canProceed) return;

    const confirmed = await confirmAction({
      title: willAutoCancelEnrollment
        ? 'Cancel entire enrollment?'
        : 'Apply one-time course changes?',
      description: willAutoCancelEnrollment
        ? 'Removing all courses will cancel this enrollment and block portal access.'
        : feePreview?.willCreateSupplementary
          ? `Add ${selectedAddCourses.length}, remove ${selectedCancelCourses.length}. A supplementary invoice may be created.`
          : `Add ${selectedAddCourses.length}, remove ${selectedCancelCourses.length}. Invoice totals will be updated.`,
      confirmLabel: 'Apply Changes',
      variant: willAutoCancelEnrollment ? 'danger' : 'info',
    });
    if (!confirmed) return;

    setSaving(true);
    setSubmitError('');

    try {
      const res = await applyOneTimeEnrollmentChanges(enrollment.id, {
        removeCourseIds: selectedCancelCourseIds,
        addCourses: selectedAddCourses.map((c) => {
          const meta = selectedMeta[c.id] || { batch: '' };
          return {
            courseId: c.id,
            batchId: meta.batch || null,
            includeBook: meta.includeBook === true,
          };
        }),
        reason: reason.trim() || undefined,
        nextPaymentDueDate:
          needsNextDueDate && nextPaymentDueDate
            ? format(nextPaymentDueDate, 'yyyy-MM-dd')
            : undefined,
        oneTimeDiscount: discountChanged && Number.isFinite(parsedDiscount) ? parsedDiscount : undefined,
      });

      if (!res.success || !res.data) {
        setSubmitError((res as { message?: string }).message ?? 'Failed to update enrollment');
        return;
      }

      const data = res.data;
      const summary: ManageOneTimeResult = {
        added: data.added,
        removed: data.removed,
        failed: 0,
        supplementary: data.supplementary,
        installmentScheduleStale: data.installmentScheduleStale,
        invoiceId: data.invoiceId,
        oneTimeDiscountUpdated: data.oneTimeDiscountUpdated,
      };

      await resolveInvoicePdf(data.invoiceId);

      setResult(summary);
      setStep('success');
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? 'Failed to update enrollment');
    } finally {
      setSaving(false);
    }
  };

  const toggleAddCourse = (c: PreviewCourse, checked: boolean) => {
    setSelectedAddCourseIds((prev) =>
      checked ? prev.filter((id) => id !== c.id) : [...prev, c.id],
    );
    if (!checked) {
      setSelectedMeta((prev) => ({
        ...prev,
        [c.id]: {
          batch: prev[c.id]?.batch || '',
          includeBook: prev[c.id]?.includeBook ?? false,
        },
      }));
    }
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
    preview,
    previewError,
    reloadPreview: loadPreview,
    loadingPreview,
    feePreview,
    loadingFeePreview,
    step,
    saving,
    submitError,
    reason,
    setReason,
    oneTimeDiscountInput,
    setOneTimeDiscountInput,
    discountChanged,
    nextPaymentDueDate,
    setNextPaymentDueDate,
    needsNextDueDate,
    availableCourses,
    activeCourses,
    selectedAddCourseIds,
    selectedCancelCourseIds,
    selectedMeta,
    setSelectedMeta,
    courseBatches,
    selectedAddCourses,
    selectedCancelCourses,
    projectedCount,
    willAutoCancelEnrollment,
    canProceed,
    addFeeDelta,
    removeFeeDelta,
    hasInvalidDiscount,
    hasInvalidDueDate,
    handleApply,
    toggleAddCourse,
    toggleCancelCourse,
    result,
    invoicePdfUrl,
    onClose,
    finishSuccess,
    studentUserId,
  };
}

export type ManageOneTimeEnrollmentController = ReturnType<typeof useManageOneTimeEnrollment>;
