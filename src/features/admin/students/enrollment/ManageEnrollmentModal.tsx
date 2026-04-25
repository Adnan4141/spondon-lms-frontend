'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getBatches } from '@/lib/api/batches';
import { getInvoices, getInvoicePdfUrl, generateAdvanceInvoices } from '@/lib/api/invoices';
import { addCourseToEnrollment, removeCourseFromEnrollment, updateEnrollment } from '@/lib/api/enrollments';
import type { Course, Enrollment, Program } from '../types';
import { fmt, fmtMonth, nextMonth, normPdfUrl } from '../utils';
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
  onDone: (summary: { added: number; removed: number; failed: number }) => void;
}) {
  const [step, setStep] = useState<'select' | 'discount' | 'success'>('select');
  const [selectedAddCourseIds, setSelectedAddCourseIds] = useState<string[]>([]);
  const [selectedCancelCourseIds, setSelectedCancelCourseIds] = useState<string[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { batch: string; startMonth: string }>>({});
  const [courseBatches, setCourseBatches] = useState<Record<string, { id: string; name: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState('Applying changes...');
  const [submitError, setSubmitError] = useState('');
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(enrollment.monthlyDiscount);
  const [result, setResult] = useState<{ added: number; removed: number; failed: number } | null>(null);
  const effMonth = nextMonth();

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

  const projectedCourses = [
    ...activeCourses.filter((c) => !selectedCancelCourseIds.includes(c.id)),
    ...selectedAddCourses,
  ];

  const hasChanges = selectedAddCourses.length > 0 || selectedCancelCourses.length > 0;
  const hasInvalidBatch = selectedAddCourses.some((c) => c.type === 'OFFLINE' && !selectedMeta[c.id]?.batch);
  const projectedCount = activeCourses.length - selectedCancelCourses.length + selectedAddCourses.length;
  const invalidFinalState = projectedCount <= 0;
  const canProceed = hasChanges && !hasInvalidBatch && !invalidFinalState;

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
        const meta = selectedMeta[c.id] || { batch: '', startMonth: c.startMonth || effMonth };
        const res = await addCourseToEnrollment(enrollment.id, {
          courseId: c.id,
          batchId: meta.batch || null,
          includeBook: false,
          startMonth: meta.startMonth || c.startMonth || effMonth,
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
        const res = await removeCourseFromEnrollment(enrollment.id, c.id);
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
        const upd = await updateEnrollment(enrollment.id, { monthlyDiscount: discount });
        if (!upd.success) {
          failures.push((upd as { message?: string }).message ?? 'Discount update failed');
        }
      }

      if (hasMutations) {
        setProgressText('Refreshing invoices...');
        await generateAdvanceInvoices({ studentUserId, months: 3 }).catch(() => undefined);
        const invoicesRes = await getInvoices({ studentUserId, month: effMonth, limit: 5 });
        const invoiceId = invoicesRes.data?.[0]?.id;
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

      const summary = { added, removed, failed: failures.length };
      setResult(summary);
      setStep('success');
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? 'Failed to update enrollment');
    } finally {
      setSaving(false);
      setProgressText('Applying changes...');
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
      {step === 'select' && (
        <div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-center">
            <ArrowRightLeft className="h-4 w-4 text-indigo-600 shrink-0" />
            <p className="text-xs text-indigo-800">
              Add courses, cancel courses, or do both together. All changes are applied on one confirmation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add Courses</p>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {availableCourses.map((c) => {
                  const checked = selectedAddCourseIds.includes(c.id);
                  const meta = selectedMeta[c.id] || { batch: '', startMonth: c.startMonth || effMonth };
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
                          <Field label="Start Month">
                            <MonthInput
                              value={meta.startMonth}
                              onChange={(v) => setSelectedMeta((prev) => ({
                                ...prev,
                                [c.id]: { ...meta, startMonth: v },
                              }))}
                              min={c.startMonth || effMonth}
                              max={c.endMonth}
                            />
                          </Field>
                          <Field label="End Month">
                            <MonthInput value={c.endMonth || ''} disabled />
                          </Field>
                        </div>
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

          {invalidFinalState && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mt-4 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-semibold">
                Enrollment must keep at least one active course. Add another course or reduce cancellation.
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
