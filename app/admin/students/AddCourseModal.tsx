'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getBatches } from '@/lib/api/batches';
import { getInvoices, getInvoicePdfUrl, generateAdvanceInvoices } from '@/lib/api/invoices';
import { addCourseToEnrollment, updateEnrollment } from '@/lib/api/enrollments';
import type { Course, Enrollment, Program } from './types';
import { fmt, fmtMonth, nextMonth, normPdfUrl } from './utils';
import { StudentAdminBadge as AppBadge } from './StudentAdminBadge';
import { StudentAdminField as Field } from './StudentAdminField';
import { StudentAdminModal as AppModal } from './StudentAdminModal';
import { StudentAdminSelect as AppSelect } from './StudentAdminSelect';
import { StudentMonthInput as MonthInput } from './StudentMonthInput';
import { DiscountAdjustmentPanel } from './DiscountAdjustmentPanel';
import { SuccessSummary } from './SuccessSummary';

export function AddCourseModal({
  enrollment, allCourses, programs, studentUserId, onClose, onDone,
}: {
  enrollment: Enrollment;
  allCourses: Course[];
  programs: Program[];
  studentUserId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'select' | 'discount' | 'success'>('select');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { batch: string; startMonth: string }>>({});
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [courseBatches, setCourseBatches] = useState<Record<string, { id: string; name: string }[]>>({});
  const effMonth = nextMonth();

  useEffect(() => {
    selectedCourseIds.forEach((cid) => {
      if (courseBatches[cid]) return;
      getBatches({ courseId: cid, limit: 100 })
        .then(res => {
          if (!res.success || !res.data) return;
          setCourseBatches(prev => ({
            ...prev,
            [cid]: res.data!.map(b => ({ id: b.id, name: b.name })),
          }));
        })
        .catch(() => {
          setCourseBatches(prev => ({ ...prev, [cid]: [] }));
        });
    });
  }, [selectedCourseIds, courseBatches]);

  const enrolledCourseIds = enrollment.courses.filter(ec => ec.status === 'ACTIVE').map(ec => ec.courseId);
  const available = allCourses.filter(c => c.programId === enrollment.programId && !enrolledCourseIds.includes(c.id));
  const selectedCourses = available.filter(c => selectedCourseIds.includes(c.id));
  const activeCourses = enrollment.courses
    .filter(ec => ec.status === 'ACTIVE')
    .map(ec => allCourses.find(c => c.id === ec.courseId))
    .filter((c): c is Course => Boolean(c));
  const allCoursesAfterAdd = [...activeCourses, ...selectedCourses];
  const canProceed = selectedCourses.length > 0 && selectedCourses.every(c => {
    const meta = selectedMeta[c.id];
    return c.type === 'ONLINE' || !!meta?.batch;
  });
  const netMonthly = allCoursesAfterAdd.reduce((s, c) => s + c.fee, 0) - appliedDiscount;

  const program = programs.find(p => p.id === enrollment.programId);
  const titles = { select: 'Add Course to Enrollment', discount: 'Adjust Monthly Discount', success: 'Course Added' };
  const subtitles = {
    select: `Program: ${program?.name ?? ''}`,
    discount: `Effective from ${fmtMonth(effMonth)}`,
    success: '',
  };

  const handleApply = async (disc: number) => {
    if (selectedCourses.length === 0) return;
    try {
      for (const c of selectedCourses) {
        const meta = selectedMeta[c.id] || { batch: '', startMonth: c.startMonth || effMonth };
        const res = await addCourseToEnrollment(enrollment.id, {
          courseId: c.id,
          batchId: meta.batch || null,
          includeBook: false,
          startMonth: meta.startMonth || c.startMonth || effMonth,
        });
        if (!res.success) throw new Error((res as { message?: string }).message ?? 'Failed to add course');
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
    }
  };

  return (
    <AppModal open onClose={onClose} title={titles[step]} subtitle={subtitles[step]}>
      {step === 'select' && (
        <div>
          <Field label="Select Course(s)" required>
            <div className="flex flex-col gap-2">
              {available.map(c => {
                const checked = selectedCourseIds.includes(c.id);
                const meta = selectedMeta[c.id] || { batch: '', startMonth: c.startMonth || effMonth };
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'border rounded-xl p-3.5 transition-all',
                      checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedCourseIds(prev => (
                            checked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          ));
                          if (!checked) {
                            setSelectedMeta(prev => ({
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
                          <span className="text-xs text-slate-400">Payment mode: monthly</span>
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
                              onChange={v => setSelectedMeta(prev => ({
                                ...prev,
                                [c.id]: { ...meta, batch: v },
                              }))}
                              placeholder="Select batch"
                              options={(courseBatches[c.id] ?? []).map(b => ({ value: b.id, label: b.name }))}
                            />
                            {!meta.batch && <p className="text-[11px] text-rose-600 mt-1">Required for offline</p>}
                          </Field>
                        )}
                        <Field label="Start Month">
                          <MonthInput
                            value={meta.startMonth}
                            onChange={v => setSelectedMeta(prev => ({
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
              {available.length === 0 && <p className="text-sm text-slate-400 text-center py-3">No available courses to add.</p>}
            </div>
          </Field>

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={!canProceed}
              onClick={() => setStep('discount')}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Plus className="h-4 w-4" /> Next: Adjust Discount
            </Button>
          </div>
        </div>
      )}

      {step === 'discount' && selectedCourses.length > 0 && (
        <DiscountAdjustmentPanel
          courses={allCoursesAfterAdd}
          currentDiscount={enrollment.monthlyDiscount}
          triggerType="ADD"
          changedCourse={selectedCourses[0]}
          effectiveMonth={effMonth}
          onApply={handleApply}
          onBack={() => setStep('select')}
        />
      )}

      {step === 'success' && selectedCourses.length > 0 && (
        <SuccessSummary
          action="ADD"
          courseName={selectedCourses.length > 1 ? `${selectedCourses.length} Courses` : selectedCourses[0].name}
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
