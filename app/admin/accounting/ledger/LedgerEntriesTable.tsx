'use client';

import type { LedgerEntry } from '@/lib/api/accounting';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { fmtCur, fmtDate, entryFlowLabel } from '../utils';

type Props = {
  loading: boolean;
  entries: LedgerEntry[];
  onEdit?: (entry: LedgerEntry) => void;
  onDelete?: (entry: LedgerEntry) => void;
  deletingId?: string | null;
};

export function LedgerEntriesTable({ loading, entries, onEdit, onDelete, deletingId }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <div className="py-16 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-sky-400" /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                {['Date', 'Voucher', 'Account', 'Type', 'Source', 'Purpose', 'Ref', 'Amount', 'Actions'].map((header) => (
                  <TableHead key={header} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-12 text-center text-sm font-bold text-slate-400">No ledger entries found.</TableCell></TableRow>
              ) : entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50/60">
                  <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDate(entry.entryDate)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-700">{entry.voucherNo || '—'}</p>
                      <p className="text-[10px] text-slate-400">{entry.voucherNo ? 'Saved' : 'Manual'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.account ? (
                      <div>
                        <p className="text-sm font-bold text-slate-900">{entry.account.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{entry.account.code}</p>
                      </div>
                    ) : <span className="text-[10px] text-slate-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      'rounded-full border px-2 text-[10px] font-black uppercase',
                      entry.entryType === 'INCOME'
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                        : entry.entryType === 'EXPENSE'
                          ? 'border-amber-200 bg-amber-100 text-amber-700'
                          : entry.entryType === 'TRANSFER'
                            ? 'border-sky-200 bg-sky-100 text-sky-700'
                            : 'border-purple-200 bg-purple-100 text-purple-700',
                    )}>
                      {entryFlowLabel(entry)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-45">
                      <p className="truncate text-xs font-bold text-slate-700">{entry.sourceLabel || entry.sourceId || '—'}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">{entry.sourceType || 'None'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-50 truncate text-sm text-slate-700">{entry.purpose || entry.description || '—'}</TableCell>
                  <TableCell>
                    {entry.refType ? <span className="text-[10px] font-bold text-slate-500">{entry.refType}{entry.refId ? ` #${entry.refId.slice(0, 8)}` : ''}</span> : '—'}
                  </TableCell>
                  <TableCell className={cn('font-black text-base', entry.entryType === 'EXPENSE' ? 'text-amber-700' : entry.entryType === 'INCOME' ? 'text-emerald-700' : 'text-slate-700')}>
                    {fmtCur(Number(entry.amount))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        title="Edit entry"
                        onClick={() => onEdit?.(entry)}
                        disabled={entry.refType !== 'simple-entry'}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 border-rose-200 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        title="Delete entry"
                        onClick={() => onDelete?.(entry)}
                        disabled={entry.refType !== 'simple-entry' || deletingId === entry.id}
                      >
                        {deletingId === entry.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
