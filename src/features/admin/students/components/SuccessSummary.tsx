'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmt, fmtMonth } from '../utils';

export function SuccessSummary({
  action, courseName, effectiveMonth, netMonthly, newDiscount, pdfUrl, onClose,
}: {
  action: 'ADD' | 'REMOVE';
  courseName: string;
  effectiveMonth: string;
  netMonthly: number;
  newDiscount: number;
  pdfUrl?: string | null;
  onClose: () => void;
}) {
  const rows = [
    ['Action', action === 'REMOVE' ? 'Course Removed' : 'Course Added'],
    ['Course', courseName],
    ['Effective From', fmtMonth(effectiveMonth)],
    ['New Monthly Fee', fmt(netMonthly)],
    ['New Discount', fmt(newDiscount)],
    ['Past Invoices', 'Unchanged ✓'],
    ['Future Snapshots', 'Regenerated ✓'],
  ];
  return (
    <div className="text-center py-2">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-1.5">Changes Applied Successfully</h3>
      <p className="text-sm text-slate-500 mb-6">
        Monthly snapshots and invoices have been regenerated from {fmtMonth(effectiveMonth)}.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-left mb-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-500">{k}</span>
            <span className="text-sm font-bold text-slate-900">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 justify-center">
        {pdfUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(pdfUrl, '_blank')}
            className="gap-2"
          >
            View Invoice PDF
          </Button>
        )}
        <Button
          onClick={onClose}
          className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
        >
          <Check className="h-4 w-4" /> Done
        </Button>
      </div>
    </div>
  );
}
