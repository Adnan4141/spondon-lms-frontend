'use client';

import { AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fmt } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import { StudentAdminSelect as AppSelect } from '../components/StudentAdminSelect';
import type { ManageOneTimeEnrollmentController } from './hooks/useManageOneTimeEnrollment';

export function ManageOneTimeSelectStep({ ctrl }: { ctrl: ManageOneTimeEnrollmentController }) {
  const {
    loadingPreview,
    preview,
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
    toggleAddCourse,
    toggleCancelCourse,
    selectedAddCourses,
    selectedCancelCourses,
    projectedCount,
    willAutoCancelEnrollment,
    canProceed,
    addFeeDelta,
    removeFeeDelta,
    saving,
    onClose,
    handleApply,
  } = ctrl;

  if (loadingPreview) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading enrollment details…</p>;
  }

  return (
    <div>
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-center">
        <Package className="h-4 w-4 text-violet-600 shrink-0" />
        <p className="text-xs text-violet-800">
          One-time program: add or remove courses. Unpaid invoices update in place; paid enrollments get a supplementary invoice or credit adjustment.
        </p>
      </div>

      {preview?.allowedActions.installmentWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-800">
            This enrollment uses installments. Course changes may require manual installment review.
          </p>
        </div>
      )}

      {preview?.invoiceState && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            ['Invoice Due', fmt(preview.invoiceState.totalDue)],
            ['Paid', fmt(preview.invoiceState.paidAmount)],
            ['One-Time Discount', fmt(preview.enrollment.oneTimeDiscount)],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
              <p className="font-bold text-sm text-slate-900">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add Courses</p>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {availableCourses.map((c) => {
              const checked = selectedAddCourseIds.includes(c.id);
              const activeBatches = (courseBatches[c.id] ?? []).filter((b) => b.status === 'ACTIVE');
              const meta = selectedMeta[c.id] || { batch: '' };
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
                        <span className="font-black text-rose-700 text-sm">{fmt(c.fee)}</span>
                      </div>
                      <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                    </div>
                  </label>
                  {checked && c.type === 'OFFLINE' && (
                    <div className="mt-3 pt-3 border-t border-dashed border-emerald-200">
                      <Field label="Batch" required>
                        <AppSelect
                          value={meta.batch}
                          onChange={(v) => setSelectedMeta((prev) => ({ ...prev, [c.id]: { batch: v } }))}
                          placeholder="Select batch"
                          options={activeBatches.map((b) => ({ value: b.id, label: b.name }))}
                        />
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
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Remove Courses</p>
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
                  <span className="text-xs font-bold text-rose-700">{fmt(c.fee)}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {(selectedAddCourses.length > 0 || selectedCancelCourses.length > 0) && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p className="font-semibold text-slate-700">
            Fee impact: {selectedAddCourses.length > 0 && <span className="text-emerald-700">+{fmt(addFeeDelta)}</span>}
            {selectedAddCourses.length > 0 && selectedCancelCourses.length > 0 && ' · '}
            {selectedCancelCourses.length > 0 && <span className="text-rose-700">−{fmt(removeFeeDelta)}</span>}
          </p>
        </div>
      )}

      <div className="mt-4">
        <Field label="Reason (optional)">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are these courses being changed?"
            className="min-h-16"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        {[
          ['To Add', String(selectedAddCourses.length)],
          ['To Remove', String(selectedCancelCourses.length)],
          ['Projected Courses', String(projectedCount)],
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
            Removing all active courses will cancel this enrollment.
          </p>
        </div>
      )}

      {submitError && (
        <p className="text-sm text-rose-600 font-semibold mt-4">{submitError}</p>
      )}

      <div className="flex justify-end gap-2.5 mt-5">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          disabled={!canProceed || saving}
          onClick={() => void handleApply()}
          className="gap-2 bg-slate-900 text-white hover:bg-violet-600 transition-all"
        >
          {saving ? 'Applying…' : 'Apply Changes'}
        </Button>
      </div>
    </div>
  );
}
