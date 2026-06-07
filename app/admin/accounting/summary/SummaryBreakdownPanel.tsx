'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { fmtCur } from '../utils';

type Row = {
  label: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
  isBranchLinked?: boolean;
};

type Props = {
  title: string;
  rows: Row[];
  highlightBranchLinked?: boolean;
};

export function SummaryBreakdownPanel({ title, rows, highlightBranchLinked = false }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-slate-400">No movement found.</p>
        ) : rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              'rounded-2xl border p-4',
              highlightBranchLinked && row.isBranchLinked
                ? 'border-sky-300 bg-sky-50/60'
                : 'border-slate-200 bg-slate-50/70',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {highlightBranchLinked && row.isBranchLinked ? (
                  <Building2 className="h-4 w-4 shrink-0 text-sky-600" />
                ) : null}
                <p className="truncate text-sm font-black text-slate-800">{row.label}</p>
                {highlightBranchLinked && row.isBranchLinked ? (
                  <Badge className="shrink-0 rounded-full border border-sky-200 bg-sky-100 px-2 text-[10px] font-black uppercase text-sky-700">
                    Branch
                  </Badge>
                ) : null}
              </div>
              <p className={row.balance >= 0 ? 'text-sm font-black text-emerald-700' : 'text-sm font-black text-rose-600'}>
                {fmtCur(row.balance)}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-black uppercase tracking-wider text-slate-400">Credit</p>
                <p className="mt-1 font-black text-emerald-700">{fmtCur(row.totalCredit)}</p>
              </div>
              <div>
                <p className="font-black uppercase tracking-wider text-slate-400">Debit</p>
                <p className="mt-1 font-black text-amber-700">{fmtCur(row.totalDebit)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
