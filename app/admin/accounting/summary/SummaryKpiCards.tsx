'use client';

import type { AccountingSummary } from '@/lib/api/accounting';
import { cn } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Scale,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { fmtCur } from '../utils';

type Props = {
  summary: AccountingSummary;
};

export function SummaryKpiCards({ summary }: Props) {
  const items = [
    { label: 'Total Credit', value: summary.totalCredit, icon: ArrowUpRight, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Total Debit', value: summary.totalDebit, icon: ArrowDownRight, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Net Movement', value: summary.balance, icon: Scale, color: summary.balance >= 0 ? 'text-sky-700' : 'text-rose-600', bg: 'bg-sky-50' },
    { label: 'Cash Net', value: summary.cashBalance, icon: Wallet, color: summary.cashBalance >= 0 ? 'text-slate-800' : 'text-rose-600', bg: 'bg-slate-100' },
    { label: 'Bank Net', value: summary.bankBalance, icon: Landmark, color: summary.bankBalance >= 0 ? 'text-indigo-700' : 'text-rose-600', bg: 'bg-indigo-50' },
    { label: 'bKash Net', value: summary.bkashBalance, icon: Smartphone, color: summary.bkashBalance >= 0 ? 'text-fuchsia-700' : 'text-rose-600', bg: 'bg-fuchsia-50' },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      {items.map((kpi) => (
        <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', kpi.bg)}>
            <kpi.icon className={cn('h-5 w-5', kpi.color)} />
          </div>
          <p className={cn('text-2xl font-black', kpi.color)}>{fmtCur(kpi.value)}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}
