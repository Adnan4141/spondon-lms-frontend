'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fmt, fmtMonth } from '../utils';
import type { CollectPaymentModalController } from './hooks/useCollectPaymentModal';

export function CollectPaymentCourseWaiverPanel({ ctrl }: { ctrl: CollectPaymentModalController }) {
  const {
    isSelectedMonthly,
    displayInvoices,
    courseWaiverRows,
    monthStatus,
    selectedMonth,
    waiving,
    setWaiving,
    selectedWaiveCourseIds,
    setSelectedWaiveCourseIds,
    selectedWaiverAmount,
    payableAfterCourseWaiver,
    waiverCreatesSettlement,
    waiveReason,
    setWaiveReason,
    handleWaive,
    waiveSubmitting,
  } = ctrl;

  if (!isSelectedMonthly) return null;

  return (
    <div className="border-t border-slate-100 pt-3">
      {!waiving ? (
        <button
          type="button"
          onClick={() => setWaiving(true)}
          disabled={displayInvoices.length === 0 || courseWaiverRows.length === 0 || monthStatus === 'WAIVED'}
          title="Waive selected course rows for this selected month"
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer',
            displayInvoices.length > 0 && courseWaiverRows.length > 0 && monthStatus !== 'WAIVED'
              ? 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'
              : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed',
          )}
        >
          Waive Selected Course(s)
        </button>
      ) : (
        <div className="border border-purple-200 rounded-xl p-3.5 bg-purple-50">
          {courseWaiverRows.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">
                Course Waiver For {fmtMonth(selectedMonth)}
              </p>
              <div className="space-y-1.5">
                {courseWaiverRows.map((item) => {
                  const courseId = item.refId!;
                  const checked = selectedWaiveCourseIds.includes(courseId);
                  return (
                    <label
                      key={`${courseId}-${item.title}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-purple-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedWaiveCourseIds((prev) =>
                              checked ? prev.filter((id) => id !== courseId) : [...prev, courseId],
                            )
                          }
                          className="accent-purple-600"
                        />
                        <span className="truncate">{item.title.replace(/^Monthly Fee:\s*/, '')}</span>
                      </span>
                      <span className="shrink-0 font-bold text-purple-700">{fmt(item.waiverAmount)}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 rounded-lg border border-purple-100 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 space-y-1">
                <div className="flex justify-between gap-3">
                  <span>Selected waiver</span>
                  <span className="shrink-0 text-purple-700">{fmt(selectedWaiverAmount)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Remaining payable after waiver</span>
                  <span className="shrink-0">{fmt(payableAfterCourseWaiver)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="shrink-0">Result</span>
                  <span className="min-w-0 text-right">
                    {waiverCreatesSettlement
                      ? 'Credit settlement on next unpaid month'
                      : 'Regenerate selected month invoice'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs font-semibold text-purple-700">
              No payable course rows found for this month.
            </p>
          )}
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">
            Waive Reason <span className="text-rose-600">*</span>
          </p>
          <textarea
            value={waiveReason}
            onChange={(e) => setWaiveReason(e.target.value)}
            placeholder="Enter reason for waiving selected course(s) (min 5 characters)..."
            rows={2}
            className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-2"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWaiving(false);
                setWaiveReason('');
                setSelectedWaiveCourseIds([]);
              }}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleWaive}
              disabled={
                selectedWaiveCourseIds.length === 0 ||
                waiveReason.trim().length < 5 ||
                waiveSubmitting
              }
              className="flex-1 text-xs bg-purple-600 text-white hover:bg-purple-700 gap-1"
            >
              <Check className="h-3 w-3" />
              {waiveSubmitting ? 'Waiving...' : 'Confirm Waiver'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
