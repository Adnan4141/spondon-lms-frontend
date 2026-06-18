'use client';

import type { ExportFormat } from '@/lib/export';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Plus, RefreshCw } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { ACCOUNT_CATEGORIES } from '../constants';

type Props = {
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  loading: boolean;
  onRefresh: () => void;
  exportDisabled: boolean;
  onExport: (format: ExportFormat) => void | Promise<void>;
  onAddAccount: () => void;
};

export function AccountsTabToolbar({
  typeFilter,
  onTypeFilterChange,
  loading,
  onRefresh,
  exportDisabled,
  onExport,
  onAddAccount,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Category</p>
        <Select value={typeFilter || 'all'} onValueChange={(v) => onTypeFilterChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-40 rounded-xl text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ACCOUNT_CATEGORIES.map((accountType) => <SelectItem key={accountType} value={accountType}>{accountType}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={onRefresh} variant="outline" size="sm" className="mt-5 gap-2" disabled={loading}>
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        Refresh
      </Button>
      <ExportButtons onExport={onExport} disabled={exportDisabled} />
      <Button type="button" onClick={onAddAccount} className="ml-auto h-9 gap-2 bg-sky-600 text-white hover:bg-sky-700 hover:text-white">
        <Plus className="h-4 w-4" />
        Add account
      </Button>
    </div>
  );
}
