'use client';

import type { Account } from '@/lib/api/accounting';
import type { ExportFormat } from '@/lib/export';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminDatePicker } from '@/features/admin/shared/form/AdminField';
import { ListOrdered, Plus, RefreshCw } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { FLOW_TYPES, SOURCE_TYPES } from '../constants';

type Props = {
  accounts: Account[];
  accountId: string;
  onAccountIdChange: (id: string) => void;
  flowType: string;
  onFlowTypeChange: (v: string) => void;
  sourceType: string;
  onSourceTypeChange: (v: string) => void;
  from: string;
  onFromChange: (v: string) => void;
  to: string;
  onToChange: (v: string) => void;
  loading: boolean;
  onSearch: () => void;
  exportDisabled: boolean;
  onExport: (format: ExportFormat) => void | Promise<void>;
  onNewEntry: () => void;
};

export function LedgerTabFilters(props: Props) {
  const {
    accounts,
    accountId,
    onAccountIdChange,
    flowType,
    onFlowTypeChange,
    sourceType,
    onSourceTypeChange,
    from,
    onFromChange,
    to,
    onToChange,
    loading,
    onSearch,
    exportDisabled,
    onExport,
    onNewEntry,
  } = props;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Account</p>
        <Select value={accountId || 'all'} onValueChange={(v) => onAccountIdChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-56 rounded-xl text-sm"><SelectValue placeholder="All Accounts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Type</p>
        <Select value={flowType || 'all'} onValueChange={(v) => onFlowTypeChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-36 rounded-xl text-sm"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {FLOW_TYPES.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value === 'CREDIT' ? 'INCOME' : item.value === 'DEBIT' ? 'EXPENSE' : item.value}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Source Type</p>
        <Select value={sourceType || 'all'} onValueChange={(v) => onSourceTypeChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-40 rounded-xl text-sm"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {SOURCE_TYPES.filter((item) => item.value !== 'NONE').map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">From</p>
        <AdminDatePicker className="w-36" value={from} onChange={onFromChange} placeholder="From date" />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">To</p>
        <AdminDatePicker className="w-36" value={to} onChange={onToChange} placeholder="To date" />
      </div>
      <Button type="button" onClick={onSearch} disabled={loading} className="h-9 gap-2 bg-sky-600 text-white hover:bg-sky-700 hover:text-white">
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ListOrdered className="h-4 w-4" />}
        Search
      </Button>
      <ExportButtons onExport={onExport} disabled={exportDisabled} />
      <Button type="button" onClick={onNewEntry} className="ml-auto h-9 gap-2 bg-sky-600 text-white hover:bg-sky-700 hover:text-white">
        <Plus className="h-4 w-4" />
        New entry
      </Button>
    </div>
  );
}
