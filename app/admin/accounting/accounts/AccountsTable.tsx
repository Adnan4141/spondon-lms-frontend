'use client';

import type { Account } from '@/lib/api/accounting';
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
import { Building2, Pencil, RefreshCw } from 'lucide-react';
import { TYPE_COLORS } from '../constants';
import { accountCategory } from '../utils';

type Props = {
  loading: boolean;
  accounts: Account[];
  onEdit: (account: Account) => void;
};

export function AccountsTable({ loading, accounts, onEdit }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <div className="py-16 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-sky-400" /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                {['Code', 'Account Name', 'Category', 'Branch', 'Status', ''].map((header) => (
                  <TableHead key={header} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm font-bold text-slate-400">No accounts found. Create one to get started.</TableCell></TableRow>
              ) : accounts.map((account) => (
                <TableRow key={account.id} className="group hover:bg-slate-50/60">
                  <TableCell className="font-mono text-xs font-bold text-slate-600">{account.code}</TableCell>
                  <TableCell className="font-bold text-slate-900">{account.name}</TableCell>
                  <TableCell>
                    <Badge className={cn('rounded-full border text-[10px] font-black uppercase px-2', TYPE_COLORS[account.type] ?? 'bg-slate-100 text-slate-700')}>
                      {accountCategory(account)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.branchId ? <div className="flex items-center gap-1.5 text-xs text-slate-600"><Building2 className="h-3.5 w-3.5 text-slate-400" />Branch linked</div> : <span className="text-[10px] font-bold uppercase text-slate-300">Head Office</span>}
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase', account.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button type="button" onClick={() => onEdit(account)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-colors hover:bg-amber-50 hover:text-amber-600 group-hover:opacity-100">
                      <Pencil className="h-4 w-4" />
                    </button>
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
