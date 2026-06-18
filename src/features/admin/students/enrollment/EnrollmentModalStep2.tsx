'use client';

import { AlertTriangle, ArrowLeft, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fmt } from '../utils';
import { moneyNumber } from './enrollment-modal-utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import type { EnrollmentModalController } from './hooks/useEnrollmentModal';

export function EnrollmentModalStep2({ ctrl }: { ctrl: EnrollmentModalController }) {
  const {
    student,
    program,
    billingStart,
    distributed,
    selected,
    isMonthlyProgram,
    courseBatches,
    selCourses,
    grossCourseTotal,
    promotionalDiscount,
    activeDiscount,
    coursePayable,
    admFee,
    totalPayable,
    setPayNowAmount,
    payNowAmount,
    payNow,
    paymentMethod,
    setPaymentMethod,
    needsNextDueDate,
    nextPaymentDueDate,
    setNextPaymentDueDate,
    validation,
    paymentDistributionPreview,
    dueAfterPay,
    nextDueDateLabel,
    accessPreview,
    enrollError,
    saving,
    setStep,
    handleConfirm,
  } = ctrl;

  return (
    <div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 flex gap-2.5">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-800">Review enrollment details before confirming</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Once confirmed, invoices will be generated automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 mb-5">
            {[
              ['Student', student.fullName],
              ['Program', program?.name ?? ''],
              ['Billing', program?.paymentCircle ?? ''],
              ['Start Month', billingStart],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="font-bold text-sm text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Course', 'Type', 'Batch', 'Course Fee', 'Promo', isMonthlyProgram ? 'Scholarship' : 'One-time Discount', 'Net Fee'].map(h => (
                    <th
                      key={h}
                      className={cn(
                        'px-3.5 py-2.5 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200',
                        ['Course', 'Type', 'Batch'].includes(h) ? 'text-left' : 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributed.map(c => {
                  const originalCourse = selected.find(course => course.id === c.id);
                  const grossFee = moneyNumber(originalCourse?.fee);
                  const promoDiscount = Math.max(0, grossFee - c.fee);
                  return (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-3.5 py-3 font-bold text-slate-900">{c.name}</td>
                      <td className="px-3.5 py-3">
                        <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                      </td>
                      <td className="px-3.5 py-3 text-slate-500">
                        {courseBatches[c.id]?.find(b => b.id === selCourses[c.id]?.batch)?.name || '—'}
                      </td>
                      <td className="px-3.5 py-3 text-right font-semibold">{fmt(grossFee)}</td>
                      <td className="px-3.5 py-3 text-right font-semibold text-emerald-700">
                        {promoDiscount > 0 ? `−${fmt(promoDiscount)}` : '—'}
                      </td>
                      <td className="px-3.5 py-3 text-right text-rose-500 font-semibold">
                        {c.discount > 0 ? `−${fmt(c.discount)}` : '—'}
                      </td>
                      <td className="px-3.5 py-3 text-right font-black text-rose-700">{fmt(c.fee - c.discount)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-rose-50 border-t-2 border-rose-200">
                  <td colSpan={3} className="px-3.5 py-3 font-black text-slate-900">
                    {isMonthlyProgram ? 'Total Monthly Payable' : 'Total Payable'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-bold">{fmt(grossCourseTotal)}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-emerald-700">
                    {promotionalDiscount > 0 ? `−${fmt(promotionalDiscount)}` : '—'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-bold text-rose-500">
                    {activeDiscount > 0 ? `−${fmt(activeDiscount)}` : '—'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-black text-rose-700 text-base">
                    {fmt(coursePayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {program?.admissionFeeEnabled && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">Admission Fee (one-time)</span>
              <span className="font-black text-lg text-rose-700">{fmt(admFee)}</span>
            </div>
          )}

          <div className="grid grid-cols-[1fr_320px] gap-4 mb-5">
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payment at Admission</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'No payment', value: 0 },
                  { label: 'Admission only', value: admFee, disabled: admFee <= 0 },
                  { label: 'Full payment', value: totalPayable },
                ].map(option => (
                  <button
                    key={option.label}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => setPayNowAmount(String(Math.min(option.value, totalPayable)))}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs font-bold transition-colors',
                      option.disabled
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Field label="Pay Now Amount">
                <Input
                  type="number"
                  min={0}
                  max={totalPayable}
                  value={payNowAmount}
                  onChange={e => {
                    const next = Number(e.target.value) || 0;
                    setPayNowAmount(next > totalPayable ? String(totalPayable) : e.target.value);
                  }}
                  className="text-right focus-visible:ring-indigo-400"
                />
                {validation.errors.payNowAmount && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.payNowAmount}</p>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {(['CASH', 'BKASH'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    disabled={payNow <= 0}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm font-bold transition-colors',
                      paymentMethod === method && payNow > 0
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      payNow <= 0 && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {method === 'CASH' ? 'Cash' : 'bKash'}
                  </button>
                ))}
              </div>
              {needsNextDueDate && (
                <Field label="Next Due Date" required>
                  <DatePicker
                    date={nextPaymentDueDate}
                    setDate={setNextPaymentDueDate}
                    placeholder="Pick next due date"
                  />
                  {validation.errors.nextPaymentDueDate && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{validation.errors.nextPaymentDueDate}</p>
                  )}
                </Field>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Preview</p>
              {[
                ['Course fee', fmt(grossCourseTotal)],
                ...(promotionalDiscount > 0 ? [['Promotional discount', `−${fmt(promotionalDiscount)}`]] : []),
                [isMonthlyProgram ? 'Scholarship' : 'One-time discount', activeDiscount > 0 ? `−${fmt(activeDiscount)}` : '—'],
                ...(admFee > 0 ? [['Admission fee', fmt(admFee)]] : []),
                ['Total payable', fmt(totalPayable)],
                ['Pay now', fmt(payNow)],
                ['Due after admission', fmt(dueAfterPay)],
                ...(needsNextDueDate && nextPaymentDueDate ? [['Next due date', nextDueDateLabel]] : []),
                ['Invoice status', payNow <= 0 ? 'ISSUED' : dueAfterPay > 0 ? 'PARTIAL' : 'PAID'],
                ['Enrollment status', payNow > 0 ? 'ACTIVE' : 'PENDING_PAYMENT'],
                ['Access status', accessPreview],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-slate-200 last:border-0">
                  <span className="text-sm text-slate-500">{k}</span>
                  <span className="text-sm font-black text-slate-900 text-right">{v}</span>
                </div>
              ))}
              {payNow > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Payment Distribution
                  </p>
                  {paymentDistributionPreview.admissionDue > 0 && (
                    <div className="flex justify-between gap-3 rounded-lg bg-white px-2.5 py-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">Admission fee</span>
                      <span className="text-xs font-black text-slate-900">
                        {fmt(paymentDistributionPreview.admissionApplied)}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {paymentDistributionPreview.courseAllocations.map(row => (
                      <div key={row.id} className="rounded-lg bg-white px-2.5 py-2">
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0 truncate text-xs font-semibold text-slate-600">{row.name}</span>
                          <span className="shrink-0 text-xs font-black text-slate-900">{fmt(row.applied)}</span>
                        </div>
                        <div className="mt-0.5 flex justify-between gap-3 text-[11px] text-slate-400">
                          <span>Due before {fmt(row.due)}</span>
                          <span>After {fmt(row.dueAfter)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {dueAfterPay > 0 && (
                    <p className="mt-2 flex gap-1.5 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Partial payment leaves {fmt(dueAfterPay)} due after admission. 
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
            {enrollError && <p className="text-sm text-rose-600 font-semibold self-center">{enrollError}</p>}
            <Button
              onClick={handleConfirm}
              disabled={saving || !validation.success}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Check className="h-4 w-4" /> {saving ? 'Processing…' : 'Confirm Admission'}
            </Button>
          </div>
        </div>
  );
}
