'use client';

import { useEffect, useState } from 'react';
import { getBatches } from '@/lib/api/batches';
import {
  addCourseToEnrollment,
  getOneTimeEnrollmentPreview,
  removeCourseFromEnrollment,
  type OneTimeEnrollmentPreview,
} from '@/lib/api/enrollments';
import type { Course } from '../../types';
import { fmt } from '../../utils';
import type {
  ManageOneTimeEnrollmentModalProps,
  ManageOneTimeResult,
  ManageOneTimeStep,
} from '../manage-one-time-enrollment-utils';

type PreviewCourse = Pick<Course, 'id' | 'name' | 'fee' | 'type' | 'programId'> & {
  startMonth?: string | null;
  endMonth?: string | null;
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
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [selectedAddCourseIds, setSelectedAddCourseIds] = useState<string[]>([]);
  const [selectedCancelCourseIds, setSelectedCancelCourseIds] = useState<string[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { batch: string }>>({});
  const [courseBatches, setCourseBatches] = useState<
    Record<string, { id: string; name: string; status: string }[]>
  >({});
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<ManageOneTimeResult | null>(null);

  const program = programs.find((p) => p.id === enrollment.programId);

  useEffect(() => {
    setLoadingPreview(true);
    getOneTimeEnrollmentPreview(enrollment.id)
      .then((res) => {
        if (res.success && res.data) setPreview(res.data);
        else setPreview(null);
      })
      .catch(() => setPreview(null))
      .finally(() => setLoadingPreview(false));
  }, [enrollment.id]);

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
  }));

  const activeCourseIds = activeCourses.map((c) => c.id);
  const selectedAddCourses = availableCourses.filter((c) => selectedAddCourseIds.includes(c.id));
  const selectedCancelCourses = activeCourses.filter((c) => selectedCancelCourseIds.includes(c.id));

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

  const hasChanges = selectedAddCourses.length > 0 || selectedCancelCourses.length > 0;
  const hasInvalidBatch = selectedAddCourses.some(
    (c) => c.type === 'OFFLINE' && !selectedMeta[c.id]?.batch,
  );
  const projectedCount =
    activeCourses.length - selectedCancelCourses.length + selectedAddCourses.length;
  const willAutoCancelEnrollment = projectedCount <= 0 && selectedCancelCourses.length > 0;
  const canProceed = hasChanges && !hasInvalidBatch && projectedCount >= 0;

  const addFeeDelta = selectedAddCourses.reduce((sum, c) => sum + c.fee, 0);
  const removeFeeDelta = selectedCancelCourses.reduce((sum, c) => sum + c.fee, 0);

  const handleApply = async () => {
    if (!canProceed) return;

    setSaving(true);
    setSubmitError('');

    const failures: string[] = [];
    let added = 0;
    let removed = 0;
    let supplementary = false;

    try {
      for (const c of selectedCancelCourses) {
        const res = await removeCourseFromEnrollment(enrollment.id, c.id, {
          cancellationPolicy: 'FULL_REMOVE',
          reason: reason.trim() || undefined,
        });
        if (res.success) {
          removed += 1;
        } else {
          failures.push(`${c.name}: ${(res as { message?: string }).message ?? 'Remove failed'}`);
        }
      }

      for (const c of selectedAddCourses) {
        const meta = selectedMeta[c.id] || { batch: '' };
        const res = await addCourseToEnrollment(enrollment.id, {
          courseId: c.id,
          batchId: meta.batch || null,
          includeBook: false,
          reason: reason.trim() || undefined,
        });
        if (res.success) {
          added += 1;
          if ((res.data as { supplementary?: boolean })?.supplementary) supplementary = true;
        } else {
          failures.push(`${c.name}: ${(res as { message?: string }).message ?? 'Add failed'}`);
        }
      }

      if (added === 0 && removed === 0) {
        setSubmitError('No changes were applied.');
        return;
      }

      if (failures.length) {
        setSubmitError(`Some updates failed: ${failures.join(' | ')}`);
      }

      const summary: ManageOneTimeResult = { added, removed, failed: failures.length, supplementary };
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
        [c.id]: { batch: prev[c.id]?.batch || '' },
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
    loadingPreview,
    step,
    saving,
    submitError,
    reason,
    setReason,
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
    handleApply,
    toggleAddCourse,
    toggleCancelCourse,
    result,
    onClose,
    finishSuccess,
    studentUserId,
  };
}

export type ManageOneTimeEnrollmentController = ReturnType<typeof useManageOneTimeEnrollment>;
