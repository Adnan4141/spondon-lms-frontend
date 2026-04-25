'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getInvoices, getInvoicePdfUrl, generateAdvanceInvoices } from '@/lib/api/invoices';
import { removeCourseFromEnrollment, updateEnrollment } from '@/lib/api/enrollments';
import type { Course, Enrollment } from './types';
import { fmt, fmtMonth, nextMonth, normPdfUrl } from './utils';
import { StudentAdminModal as AppModal } from './StudentAdminModal';
import { DiscountAdjustmentPanel } from './DiscountAdjustmentPanel';
import { SuccessSummary } from './SuccessSummary';

export function CancelCourseModal({
  course, enrollment, allCourses, studentUserId, onClose, onDone,
}: {
  course: Course;
  enrollment: Enrollment;
  allCourses: Course[];
  studentUserId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'confirm' | 'discount' | 'success'>('confirm');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([course.id]);
  const effMonth = nextMonth();

  const activeCourses = enrollment.courses
    .filter(ec => ec.status === 'ACTIVE')
    .map(ec => allCourses.find(c => c.id === ec.courseId))
    .filter((c): c is Course => Boolean(c));

  const selectedCancelCourses = activeCourses.filter(c => selectedCourseIds.includes(c.id));

  const remainingCourses = enrollment.courses
    .filter(ec => !selectedCourseIds.includes(ec.courseId) && ec.status === 'ACTIVE')
    .map(ec => allCourses.find(c => c.id === ec.courseId))
    .filter((c): c is Course => Boolean(c));

  const handleApply = async (disc: number) => {
    if (selectedCourseIds.length === 0) return;
    setSaving(true);
    try {
      for (const courseId of selectedCourseIds) {
        const res = await removeCourseFromEnrollment(enrollment.id, courseId);
        if (!res.success) throw new Error((res as { message?: string }).message ?? 'Failed to remove course');
      }
      if (disc !== enrollment.monthlyDiscount) {
        // Backend will regenerate invoices with the new discount applied
        await updateEnrollment(enrollment.id, { monthlyDiscount: disc });
      }
      setAppliedDiscount(disc);
      // Ensure the effective month invoice exists (advance gen), then fetch its refreshed PDF.
      // The backend has already regenerated existing unpaid invoices; this fills any gaps.
      generateAdvanceInvoices({ studentUserId, months: 3 })
        .catch(() => {})
        .then(() => getInvoices({ studentUserId, month: effMonth, limit: 5 }))
        .then(r => {
          const firstId = r.data?.[0]?.id;
          if (firstId) return getInvoicePdfUrl(firstId);
          return null;
        })
        .then(r => {
          if (r?.data?.pdfUrl) setInvoicePdfUrl(normPdfUrl(r.data.pdfUrl));
        })
        .catch(() => {});
      setStep('success');
    } catch (err: unknown) {
      alert((err as Error).message ?? 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const netMonthly = remainingCourses.reduce((s, c) => s + c.fee, 0) - appliedDiscount;

  const titles = { confirm: 'Cancel Course', discount: 'Adjust Monthly Discount', success: 'Changes Applied' };
  const subtitles = {
    confirm: selectedCancelCourses.length > 1
      ? `Removing ${selectedCancelCourses.length} courses from enrollment`
      : `Removing ${selectedCancelCourses[0]?.name || course.name} from enrollment`,
    discount: `Effective from ${fmtMonth(effMonth)}`,
    success: '',
  };

  return (
    <AppModal open onClose={onClose} title={titles[step]} subtitle={subtitles[step]}>
      {step === 'confirm' && (
        <div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-orange-800">This action affects future months only</p>
              <p className="text-xs text-orange-600 mt-1">
                Past invoices and snapshots will remain unchanged. A settlement (CREDIT) will be created.
              </p>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Select course(s) to cancel</p>
            <div className="flex flex-col gap-2">
              {activeCourses.map(c => {
                const checked = selectedCourseIds.includes(c.id);
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
                        onChange={() => setSelectedCourseIds(prev => (
                          checked ? prev.filter(id => id !== c.id) : [...prev, c.id]
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
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {[
                ['Selected', String(selectedCourseIds.length)],
                ['Selected Fee', `${fmt(selectedCancelCourses.reduce((s, c) => s + c.fee, 0))}/month`],
                ['Effective From', fmtMonth(effMonth)],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                  <p className="font-bold text-sm text-slate-900">{v}</p>
                </div>
              ))}
            </div>
          </div>
          {remainingCourses.length === 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-semibold">
                This is the only active course. Cancelling it will also cancel the enrollment.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={selectedCourseIds.length === 0}
              onClick={() => setStep('discount')}
              className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Confirm Cancellation
            </Button>
          </div>
        </div>
      )}

      {step === 'discount' && (
        <DiscountAdjustmentPanel
          courses={remainingCourses}
          currentDiscount={enrollment.monthlyDiscount}
          triggerType="REMOVE"
          changedCourse={selectedCancelCourses[0] || course}
          effectiveMonth={effMonth}
          onApply={handleApply}
          onBack={saving ? () => undefined : () => setStep('confirm')}
        />
      )}

      {step === 'success' && (
        <SuccessSummary
          action="REMOVE"
          courseName={selectedCancelCourses.length > 1 ? `${selectedCancelCourses.length} Courses` : (selectedCancelCourses[0]?.name || course.name)}
          effectiveMonth={effMonth}
          netMonthly={netMonthly}
          newDiscount={appliedDiscount}
          pdfUrl={invoicePdfUrl}
          onClose={() => { onDone(); onClose(); }}
        />
      )}
    </AppModal>
  );
}

// ─── ADD COURSE MODAL ─────────────────────────────────────────────────────────
