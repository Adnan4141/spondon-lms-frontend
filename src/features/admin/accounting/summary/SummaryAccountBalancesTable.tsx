'use client';

import type { AccountingSummary } from '@/lib/api/accounting';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TYPE_COLORS } from '../constants';
import { fmtCur } from '../utils';

type Row = AccountingSummary['recentAccountBalances'][number];

type Props = {
  rows: Row[];
};

export function SummaryAccountBalancesTable({ rows }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-black text-slate-900">Account Net Movement</h3>
        <p className="text-xs text-slate-500">Credit minus debit by account code for the selected range</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              {['Code', 'Account', 'Category', 'Debit', 'Credit', 'Net'].map((header) => (
                <TableHead key={header} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm font-bold text-slate-400">No balances to show.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.accountId} className="hover:bg-slate-50/60">
                <TableCell className="font-mono text-xs font-bold text-slate-600">{row.accountCode}</TableCell>
                <TableCell className="font-bold text-slate-900">{row.accountName}</TableCell>
                <TableCell><Badge className={cn('rounded-full border text-[10px] font-black uppercase', TYPE_COLORS[row.accountType] ?? 'bg-slate-100 text-slate-700')}>{row.accountType}</Badge></TableCell>
                <TableCell className="font-black text-amber-700">{fmtCur(row.totalDebit)}</TableCell>
                <TableCell className="font-black text-emerald-700">{fmtCur(row.totalCredit)}</TableCell>
                <TableCell className={cn('font-black', row.balance >= 0 ? 'text-sky-700' : 'text-rose-600')}>{fmtCur(row.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
