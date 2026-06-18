'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmt, fmtMonth } from '../utils';
import type { ManageEnrollmentModalController } from './hooks/useManageEnrollmentModal';

export function ManageEnrollmentSuccessStep({ ctrl }: { ctrl: ManageEnrollmentModalController }) {
  const {
    result,
    effMonth,
    appliedDiscount,
    submitError,
    invoicePdfUrl,
    finishSuccess,
  } = ctrl;

  if (!result) return null;

  return (
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
              onClick={finishSuccess}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Check className="h-4 w-4" /> Done
            </Button>
          </div>
        </div>
  );
}
