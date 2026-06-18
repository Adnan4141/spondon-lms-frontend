'use client';

import type { AccountingSummary } from '@/lib/api/accounting';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TYPE_COLORS } from '../constants';
import { fmtCur } from '../utils';

type Props = {
  byType: AccountingSummary['byType'];
  totalAccounts: number;
};

export function SummaryByTypePanel({ byType, totalAccounts }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">Net Movement By Category</h3>
          <p className="text-xs text-slate-500">Positive means more credit than debit for the selected range.</p>
        </div>
        <Badge className="rounded-full bg-sky-100 text-[10px] font-black uppercase text-sky-700">{totalAccounts} accounts</Badge>
      </div>
      <div className="space-y-3">
        {byType.length === 0 ? (
          <p className="py-10 text-center text-sm font-bold text-slate-400">No account movement found for the selected range.</p>
        ) : byType.map((item) => (
          <div key={item.type} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge className={cn('rounded-full border text-[10px] font-black uppercase', TYPE_COLORS[item.type] ?? 'bg-slate-100 text-slate-700')}>
                {item.type}
              </Badge>
              <span className={cn('text-sm font-black', item.balance >= 0 ? 'text-sky-700' : 'text-rose-600')}>{fmtCur(item.balance)}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Debit</p>
                <p className="mt-1 font-black text-amber-700">{fmtCur(item.totalDebit)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Credit</p>
                <p className="mt-1 font-black text-emerald-700">{fmtCur(item.totalCredit)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net</p>
                <p className={cn('mt-1 font-black', item.balance >= 0 ? 'text-sky-700' : 'text-rose-600')}>{fmtCur(item.balance)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
