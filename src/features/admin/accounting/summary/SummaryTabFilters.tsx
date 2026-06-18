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
import { AdminDatePicker } from '@/features/admin/shared/form/AdminField';
import { BarChart3, RefreshCw } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';

type Props = {
  from: string;
  onFromChange: (v: string) => void;
  to: string;
  onToChange: (v: string) => void;
  loading: boolean;
  onRefresh: () => void;
  exportDisabled: boolean;
  onExport: (format: ExportFormat) => void | Promise<void>;
};

export function SummaryTabFilters({
  from,
  onFromChange,
  to,
  onToChange,
  loading,
  onRefresh,
  exportDisabled,
  onExport,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">From</p>
        <AdminDatePicker className="w-36" value={from} onChange={onFromChange} placeholder="From date" />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">To</p>
        <AdminDatePicker className="w-36" value={to} onChange={onToChange} placeholder="To date" />
      </div>
      <Button type="button" onClick={onRefresh} disabled={loading} className="h-9 gap-2 bg-sky-600 text-white hover:bg-sky-700 hover:text-white">
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
        Refresh
      </Button>
      <div className="ml-auto">
        <ExportButtons onExport={onExport} disabled={exportDisabled} />
      </div>
    </div>
  );
}
