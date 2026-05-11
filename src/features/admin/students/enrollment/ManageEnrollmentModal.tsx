'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getBatches } from '@/lib/api/batches';
import { getInvoices, getInvoicePdfUrl, generateAdvanceInvoices } from '@/lib/api/invoices';
import { addCourseToEnrollment, correctionResetEnrollment, removeCourseFromEnrollment, updateEnrollment } from '@/lib/api/enrollments';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import type { Course, Enrollment, Program } from '../types';
import { currentMonth, fmt, fmtMonth, normPdfUrl } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import { StudentAdminSelect as AppSelect } from '../components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '../components/StudentMonthInput';
import { DiscountAdjustmentPanel } from './DiscountAdjustmentPanel';

export function ManageEnrollmentModal({
  enrollment,
  allCourses,
  programs,
  studentUserId,
  initialCancelCourseId,
  onClose,
  onDone,
}: {
  enrollment: Enrollment;
  allCourses: Course[];
  programs: Program[];
  studentUserId: string;
  initialCancelCourseId?: string;
  onClose: () => void;
  onDone: (summary: { added: number; removed: number; failed: number; effectiveMonth: string }) => void;
}) {
  const getCourseTimelineError = (course: Course, meta: { batch: string; startMonth: string; endMonth: string }) => {
    if (!meta.startMonth) return 'Start month is required';
    if (!meta.endMonth) return 'End month is required';
    if (course.startMonth && meta.startMonth < course.startMonth) {
      return `Start month cannot be before ${course.startMonth}`;
    }
    if (course.endMonth && meta.endMonth > course.endMonth) {
      return `End month cannot be after ${course.endMonth}`;
    }
    if (meta.endMonth < meta.startMonth) {
      return 'End month cannot be before start month';
    }
    return null;
  };

  const [step, setStep] = useState<'select' | 'discount' | 'success'>('select');
  const [selectedAddCourseIds, setSelectedAddCourseIds] = useState<string[]>([]);
  const [selectedCancelCourseIds, setSelectedCancelCourseIds] = useState<string[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { batch: string; startMonth: string; endMonth: string }>>({});
  const [courseBatches, setCourseBatches] = useState<Record<string, { id: string; name: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState('Applying changes...');
  const [submitError, setSubmitError] = useState('');
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(enrollment.monthlyDiscount);
  const [effectiveMonth, setEffectiveMonth] = useState(() => currentMonth());
  const [result, setResult] = useState<{ added: number; removed: number; failed: number; effectiveMonth: string } | null>(null);
  const [correctionMode, setCorrectionMode] = useState<'discount' | 'restore' | 'both'>('discount');
  const [correctionDiscount, setCorrectionDiscount] = useState(String(enrollment.monthlyDiscount ?? 0));
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const effMonth = effectiveMonth;
  const { toast, toasts, removeToast } = useToast();

  const program = programs.find((p) => p.id === enrollment.programId);

  const activeCourses = useMemo(() => (
    enrollment.courses
      .filter((ec) => ec.status === 'ACTIVE')
      .map((ec) => allCourses.find((c) => c.id === ec.courseId))
      .filter((c): c is Course => Boolean(c))
  ), [allCourses, enrollment.courses]);

  const activeCourseIds = activeCourses.map((c) => c.id);
  const availableCourses = allCourses.filter(
    (c) => c.programId === enrollment.programId && !activeCourseIds.includes(c.id),
  );
  const selectedAddCourses = availableCourses.filter((c) => selectedAddCourseIds.includes(c.id));
  const selectedCancelCourses = activeCourses.filter((c) => selectedCancelCourseIds.includes(c.id));
  const cancelledCourseCount = enrollment.courses.filter((ec) => ec.status === 'CANCELLED' || ec.cancelEffectiveMonth).length;

  const projectedCourses = [
    ...activeCourses.filter((c) => !selectedCancelCourseIds.includes(c.id)),
    ...selectedAddCourses,
  ];

  const hasChanges = selectedAddCourses.length > 0 || selectedCancelCourses.length > 0;
  const hasInvalidBatch = selectedAddCourses.some((c) => c.type === 'OFFLINE' && !selectedMeta[c.id]?.batch);
  const hasInvalidTimeline = selectedAddCourses.some((course) => {
    const meta = selectedMeta[course.id] || {
      batch: '',
      startMonth: course.startMonth || effMonth,
      endMonth: course.endMonth || course.startMonth || effMonth,
    };
    return Boolean(getCourseTimelineError(course, meta));
  });
  const projectedCount = activeCourses.length - selectedCancelCourses.length + selectedAddCourses.length;
  const willAutoCancelEnrollment = projectedCount <= 0 && selectedCancelCourses.length > 0;
  const invalidFinalState = projectedCount < 0;
  const canProceed = hasChanges && !hasInvalidBatch && !hasInvalidTimeline && !invalidFinalState;

  const triggerType = selectedCancelCourses.length > 0 && selectedAddCourses.length === 0 ? 'REMOVE' : 'ADD';
  const changedCourse = selectedAddCourses[0] || selectedCancelCourses[0] || activeCourses[0];

  useEffect(() => {
    if (!initialCancelCourseId) return;
    if (!activeCourseIds.includes(initialCancelCourseId)) return;
    setSelectedCancelCourseIds((prev) => (
      prev.includes(initialCancelCourseId) ? prev : [...prev, initialCancelCourseId]
    ));
  }, [activeCourseIds, initialCancelCourseId]);

  useEffect(() => {
    selectedAddCourseIds.forEach((cid) => {
      if (courseBatches[cid]) return;
      getBatches({ courseId: cid, limit: 100 })
        .then((res) => {
          if (!res.success || !res.data) return;
          setCourseBatches((prev) => ({
            ...prev,
            [cid]: res.data!.map((b) => ({ id: b.id, name: b.name })),
          }));
        })
        .catch(() => {
          setCourseBatches((prev) => ({ ...prev, [cid]: [] }));
        });
    });
  }, [selectedAddCourseIds, courseBatches]);

  const handleApply = async (discount: number) => {
    if (!hasChanges || !canProceed) return;

    setSaving(true);
    setSubmitError('');

    const failures: string[] = [];
    let added = 0;
    let removed = 0;

    const addSelectedCourses = async () => {
      if (selectedAddCourses.length === 0) return;
      setProgressText(`Adding ${selectedAddCourses.length} course(s)...`);
      for (const c of selectedAddCourses) {
        const meta = selectedMeta[c.id] || {
          batch: '',
          startMonth: c.startMonth || effMonth,
          endMonth: c.endMonth || c.startMonth || effMonth,
        };
        const res = await addCourseToEnrollment(enrollment.id, {
          courseId: c.id,
          batchId: meta.batch || null,
          includeBook: false,
          startMonth: meta.startMonth || c.startMonth || effMonth,
          endMonth: meta.endMonth || c.endMonth || meta.startMonth || c.startMonth || effMonth,
          effectiveMonth: effMonth,
        });
        if (res.success) {
          added += 1;
        } else {
          failures.push(`${c.name}: ${(res as { message?: string }).message ?? 'Add failed'}`);
        }
      }
    };

    const cancelSelectedCourses = async () => {
      if (selectedCancelCourses.length === 0) return;
      setProgressText(`Cancelling ${selectedCancelCourses.length} course(s)...`);
      for (const c of selectedCancelCourses) {
        const res = await removeCourseFromEnrollment(enrollment.id, c.id, {
          effectiveMonth: effMonth,
          cancellationPolicy: 'FULL_REMOVE',
        });
        if (res.success) {
          removed += 1;
        } else {
          failures.push(`${c.name}: ${(res as { message?: string }).message ?? 'Cancel failed'}`);
        }
      }
    };

    try {
      const needsAddFirst = selectedCancelCourses.length >= activeCourses.length && selectedAddCourses.length > 0;

      if (needsAddFirst) {
        await addSelectedCourses();
        await cancelSelectedCourses();
      } else {
        await cancelSelectedCourses();
        await addSelectedCourses();
      }

      const hasMutations = added > 0 || removed > 0;
      if (hasMutations && discount !== enrollment.monthlyDiscount) {
        setProgressText('Updating monthly discount...');
        const upd = await updateEnrollment(enrollment.id, {
          monthlyDiscount: discount,
          effectiveMonth: effMonth,
          reason: 'Monthly discount adjustment from Manage Enrollment',
        });
        if (!upd.success) {
          failures.push((upd as { message?: string }).message ?? 'Discount update failed');
        }
      }

      if (hasMutations) {
        setProgressText('Refreshing invoices...');
        const advanceRes = await generateAdvanceInvoices({ studentUserId, months: 3 });
        if (!advanceRes.success) {
          failures.push((advanceRes as { message?: string }).message ?? 'Advance invoice refresh failed');
        }

        const invoicesRes = await getInvoices({ studentUserId, limit: 20 });
        if (!invoicesRes.success) {
          failures.push((invoicesRes as { message?: string }).message ?? 'Invoice list refresh failed');
        }

        const invoiceId = invoicesRes.data?.find((inv) => inv.month === effMonth && inv.status !== 'CANCELLED')?.id
          ?? invoicesRes.data?.find((inv) => inv.status !== 'CANCELLED')?.id;
        if (invoiceId) {
          const pdfRes = await getInvoicePdfUrl(invoiceId);
          if (pdfRes?.data?.pdfUrl) setInvoicePdfUrl(normPdfUrl(pdfRes.data.pdfUrl));
        }
      }

      setAppliedDiscount(discount);

      if (!hasMutations) {
        setSubmitError('No changes were applied. Please review your selections and try again.');
        return;
      }

      if (failures.length) {
        setSubmitError(`Some updates failed: ${failures.join(' | ')}`);
      }

      const summary = { added, removed, failed: failures.length, effectiveMonth: effMonth };
      setResult(summary);
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
      toast({ title: 'Reason required', description: 'Write why this correction is needed.', variant: 'destructive' });
      return;
    }
    if (shouldFixDiscount && (!Number.isFinite(nextDiscount) || nextDiscount < 0)) {
      toast({ title: 'Invalid discount', description: 'Discount must be zero or greater.', variant: 'destructive' });
      return;
    }
    if (shouldRestore && cancelledCourseCount === 0) {
      toast({ title: 'No cancelled courses', description: 'There are no cancelled courses to restore.', variant: 'destructive' });
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
      ].filter(Boolean).join(' '),
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
      onDone({ added: 0, removed: 0, failed: res.data.invoiceRefreshFailedMonths?.length ?? 0, effectiveMonth: effMonth });
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

  return (
    <AppModal
      open
      onClose={saving ? () => undefined : onClose}
      title="Manage Enrollment"
      subtitle={`Program: ${program?.name ?? ''}`}
      maxWidth="max-w-5xl"
    >
      <Toaster toasts={toasts} removeToast={removeToast} />
      {step === 'select' && (
        <div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-center">
            <ArrowRightLeft className="h-4 w-4 text-indigo-600 shrink-0" />
            <p className="text-xs text-indigo-800">
              Add courses, cancel courses, or do both together. All changes are applied on one confirmation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <Field label="Effective From Month">
              <MonthInput value={effectiveMonth} onChange={setEffectiveMonth} />
            </Field>
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Recalculation</p>
              <p className="text-xs font-semibold text-slate-600">
                Changes apply from {fmtMonth(effectiveMonth)}. Open invoices from this month forward are recalculated; paid months create credit/debit adjustments.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mb-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Enrollment Corrections</p>
                <p className="text-sm font-semibold text-amber-900">
                  Use this only to fix mistaken discounts or accidental cancellation. Paid invoice history is preserved.
                </p>
              </div>
              <AppBadge label={`${cancelledCourseCount} cancelled`} color={cancelledCourseCount > 0 ? 'amber' : 'slate'} />
            </div>

            <div className="grid md:grid-cols-3 gap-2 mb-3">
              {[
                { id: 'discount' as const, label: 'Fix wrong discount', desc: 'Set the correct monthly discount' },
                { id: 'restore' as const, label: 'Undo cancellation', desc: 'Restore cancelled course rows' },
                { id: 'both' as const, label: 'Fix both', desc: 'Restore and correct discount together' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCorrectionMode(option.id)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    correctionMode === option.id
                      ? 'border-amber-500 bg-white shadow-sm'
                      : 'border-amber-200 bg-white/60 hover:bg-white',
                  )}
                >
                  <span className="block text-xs font-black text-slate-900">{option.label}</span>
                  <span className="block text-[11px] font-medium text-slate-500 mt-0.5">{option.desc}</span>
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {(correctionMode === 'discount' || correctionMode === 'both') && (
                <Field label="Correct Monthly Discount">
                  <Input
                    type="number"
                    min={0}
                    value={correctionDiscount}
                    onChange={(event) => setCorrectionDiscount(event.target.value)}
                    className="bg-white focus-visible:ring-amber-400"
                  />
                </Field>
              )}
              <div className={cn(correctionMode === 'restore' ? 'md:col-span-3' : 'md:col-span-2')}>
                <Field label="Correction Reason" required>
                  <Textarea
                    value={correctionReason}
                    onChange={(event) => setCorrectionReason(event.target.value)}
                    placeholder="Example: Wrong discount entered during admission; correcting from May 2026."
                    className="min-h-20 bg-white focus-visible:ring-amber-400"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={correctionBusy}
                onClick={() => void handleCorrectionReset()}
                className="border-amber-300 bg-white font-bold text-amber-800 hover:bg-amber-100"
              >
                {correctionBusy ? 'Applying Correction...' : 'Apply Correction Reset'}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add Courses</p>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {availableCourses.map((c) => {
                  const checked = selectedAddCourseIds.includes(c.id);
                  const meta = selectedMeta[c.id] || {
                    batch: '',
                    startMonth: c.startMonth || effMonth,
                    endMonth: c.endMonth || c.startMonth || effMonth,
                  };
                  const timelineError = getCourseTimelineError(c, meta);
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'border rounded-xl p-3 transition-all',
                        checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedAddCourseIds((prev) => (
                              checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                            ));
                            if (!checked) {
                              setSelectedMeta((prev) => ({
                                ...prev,
                                [c.id]: {
                                  batch: prev[c.id]?.batch || '',
                                  startMonth: prev[c.id]?.startMonth || c.startMonth || effMonth,
                                  endMonth: prev[c.id]?.endMonth || c.endMonth || c.startMonth || effMonth,
                                },
                              }));
                            }
                          }}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-sm text-slate-900">{c.name}</span>
                            <span className="font-black text-rose-700 text-sm">{fmt(c.fee)}/month</span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                          </div>
                        </div>
                      </label>

                      {checked && (
                        <div className={cn(
                          'grid gap-2.5 mt-3 pt-3 border-t border-dashed border-emerald-200',
                          c.type === 'OFFLINE' ? 'grid-cols-3' : 'grid-cols-2',
                        )}>
                          {c.type === 'OFFLINE' && (
                            <Field label="Batch" required>
                              <AppSelect
                                value={meta.batch}
                                onChange={(v) => setSelectedMeta((prev) => ({
                                  ...prev,
                                  [c.id]: { ...meta, batch: v },
                                }))}
                                placeholder="Select batch"
                                options={(courseBatches[c.id] ?? []).map((b) => ({ value: b.id, label: b.name }))}
                              />
                              {!meta.batch && <p className="text-[11px] text-rose-600 mt-1">Required for offline</p>}
                            </Field>
                          )}
                          <Field label="Start Month" required>
                            <MonthInput
                              value={meta.startMonth}
                              onChange={(v) => setSelectedMeta((prev) => ({
                                ...prev,
                                [c.id]: { ...meta, startMonth: v },
                              }))}
                              min={c.startMonth || effMonth}
                              max={meta.endMonth || c.endMonth}
                            />
                          </Field>
                          <Field label="End Month" required>
                            <MonthInput
                              value={meta.endMonth}
                              onChange={(v) => setSelectedMeta((prev) => ({
                                ...prev,
                                [c.id]: { ...meta, endMonth: v },
                              }))}
                              min={meta.startMonth || c.startMonth || effMonth}
                              max={c.endMonth}
                            />
                          </Field>
                        </div>
                      )}
                      {checked && timelineError && (
                        <p className="mt-2 text-[11px] font-semibold text-rose-600">{timelineError}</p>
                      )}
                    </div>
                  );
                })}
                {availableCourses.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-3">No available courses to add.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cancel Active Courses</p>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {activeCourses.map((c) => {
                  const checked = selectedCancelCourseIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        'flex items-center justify-between gap-3 border rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors',
                        checked ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedCancelCourseIds((prev) => (
                            checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          ))}
                          className="accent-rose-600"
                        />
                        <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                      </span>
                      <span className="text-xs font-bold text-rose-700">{fmt(c.fee)}/month</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {[
              ['To Add', String(selectedAddCourses.length)],
              ['To Cancel', String(selectedCancelCourses.length)],
              ['Projected Active Courses', String(projectedCount)],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="font-bold text-sm text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          {willAutoCancelEnrollment && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-semibold">
                This change will cancel all active courses. The enrollment will be auto-cancelled after apply.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 mt-5">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              disabled={!canProceed || saving}
              onClick={() => setStep('discount')}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              Next: Adjust Discount
            </Button>
          </div>
        </div>
      )}

      {step === 'discount' && changedCourse && (
        <div>
          {submitError && (
            <p className="text-sm text-rose-600 font-semibold mb-3">{submitError}</p>
          )}
          <DiscountAdjustmentPanel
            courses={projectedCourses}
            currentDiscount={enrollment.monthlyDiscount}
            triggerType={triggerType}
            changedCourse={changedCourse}
            effectiveMonth={effMonth}
            onApply={handleApply}
            onBack={() => setStep('select')}
            isApplying={saving}
            applyLabel={progressText}
          />
        </div>
      )}

      {step === 'success' && result && (
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1.5">Enrollment Updated</h3>
          <p className="text-sm text-slate-500 mb-6">
            Changes are effective from {fmtMonth(effMonth)} and future invoices were refreshed.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-left mb-6">
            {[
              ['Added Courses', String(result.added)],
              ['Cancelled Courses', String(result.removed)],
              ['Failed Operations', String(result.failed)],
              ['New Monthly Discount', fmt(appliedDiscount)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{k}</span>
                <span className="text-sm font-bold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
          {submitError && (
            <p className="text-sm text-amber-700 font-semibold mb-4">{submitError}</p>
          )}
          <div className="flex gap-2.5 justify-center">
            {invoicePdfUrl && (
              <Button variant="outline" onClick={() => window.open(invoicePdfUrl, '_blank')}>
                View Invoice PDF
              </Button>
            )}
            <Button
              onClick={() => {
                onDone(result);
                onClose();
              }}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Check className="h-4 w-4" /> Done
            </Button>
          </div>
        </div>
      )}
    </AppModal>
  );
}
