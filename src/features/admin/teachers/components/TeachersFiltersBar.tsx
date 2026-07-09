import { RefreshCw, Search, Users } from 'lucide-react';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { TeachersStatusFilter } from '../teachers-page-utils';

type TeachersFiltersBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: TeachersStatusFilter;
  onStatusFilterChange: (value: TeachersStatusFilter) => void;
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  branches: Branch[];
  isBranchAdmin: boolean;
  loading: boolean;
  count: number;
  onRefresh: () => void;
};

export function TeachersFiltersBar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  branchFilter,
  onBranchFilterChange,
  branches,
  isBranchAdmin,
  loading,
  count,
  onRefresh,
}: TeachersFiltersBarProps) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-black text-slate-900">Teacher Directory</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
            {loading ? '…' : count}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[min(100%,18rem)] flex-1 sm:flex-initial sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name, phone, email…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-10 pl-9 text-sm focus-visible:ring-violet-400"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as TeachersStatusFilter)}
          >
            <SelectTrigger className="h-10 w-[min(100%,9rem)] rounded-xl border-slate-200 bg-white sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>

          {!isBranchAdmin ? (
            <Select value={branchFilter} onValueChange={onBranchFilterChange}>
              <SelectTrigger className="h-10 w-[min(100%,11rem)] rounded-xl border-slate-200 bg-white sm:w-44">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl border-slate-200"
            onClick={onRefresh}
            title="Refresh list"
          >
            <RefreshCw className={cn('h-4 w-4 text-slate-500', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </div>
  );
}
