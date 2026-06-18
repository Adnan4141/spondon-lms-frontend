'use client';

import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fmt, fmtMonth } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import { StudentAdminSelect as AppSelect } from '../components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '../components/StudentMonthInput';
import { getCourseTimelineError } from './manage-enrollment-modal-utils';
import type { ManageEnrollmentModalController } from './hooks/useManageEnrollmentModal';

export function ManageEnrollmentSelectStep({ ctrl }: { ctrl: ManageEnrollmentModalController }) {
  const {
    effectiveMonth,
    setEffectiveMonth,
    correctionMode,
    setCorrectionMode,
    cancelledCourseCount,
    correctionDiscount,
    setCorrectionDiscount,
    correctionReason,
    setCorrectionReason,
    correctionBusy,
    handleCorrectionReset,
    availableCourses,
    activeCourses,
    selectedAddCourseIds,
    selectedCancelCourseIds,
    courseBatches,
    selectedMeta,
    effMonth,
    toggleAddCourse,
    updateCourseMeta,
    toggleCancelCourse,
    selectedAddCourses,
    selectedCancelCourses,
    projectedCount,
    willAutoCancelEnrollment,
    canProceed,
    saving,
    onClose,
    setStep,
  } = ctrl;

  return (
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
                  const activeBatches = (courseBatches[c.id] ?? []).filter((batch) => batch.status === 'ACTIVE');
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
                          onChange={() => toggleAddCourse(c, checked)}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-sm text-slate-900">{c.name}</span>
                            <span className="font-black text-rose-700 text-sm">{fmt(c.fee)}/month</span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                            {c.type === 'OFFLINE' && (
                              activeBatches.length > 0
                                ? <AppBadge label={`${activeBatches.length} Batch${activeBatches.length > 1 ? 'es' : ''}`} color="green" />
                                : <AppBadge label="No Active Batch" color="red" />
                            )}
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
                                onChange={(v) => updateCourseMeta(c.id, { ...meta, batch: v })}
                                placeholder="Select batch"
                                options={activeBatches.map((b) => ({ value: b.id, label: b.name }))}
                              />
                              {!meta.batch && (
                                <p className="text-[11px] text-rose-600 mt-1">
                                  {activeBatches.length ? 'Required for offline' : 'No active batch for this enrollment branch'}
                                </p>
                              )}
                            </Field>
                          )}
                          <Field label="Start Month" required>
                            <MonthInput
                              value={meta.startMonth}
                              onChange={(v) => updateCourseMeta(c.id, { ...meta, startMonth: v })}
                              min={c.startMonth || effMonth}
                              max={meta.endMonth || c.endMonth}
                            />
                          </Field>
                          <Field label="End Month" required>
                            <MonthInput
                              value={meta.endMonth}
                              onChange={(v) => updateCourseMeta(c.id, { ...meta, endMonth: v })}
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
                          onChange={() => toggleCancelCourse(c.id, checked)}
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
  );
}
