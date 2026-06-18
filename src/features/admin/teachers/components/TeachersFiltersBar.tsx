import { RefreshCw, Search } from 'lucide-react';
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
  onRefresh,
}: TeachersFiltersBarProps) {
  return (
    <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, phone, or email…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 text-base font-bold text-slate-700 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as TeachersStatusFilter)}
          >
            <SelectTrigger className="h-14 w-full rounded-2xl sm:w-[180px] border-slate-100 bg-slate-50/50 font-bold text-slate-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 p-2">
              <SelectItem value="all" className="rounded-xl font-bold">
                Any status
              </SelectItem>
              <SelectItem value="ACTIVE" className="rounded-xl font-bold">
                Active
              </SelectItem>
              <SelectItem value="BLOCKED" className="rounded-xl font-bold">
                Blocked
              </SelectItem>
            </SelectContent>
          </Select>

          {!isBranchAdmin ? (
            <Select value={branchFilter} onValueChange={onBranchFilterChange}>
              <SelectTrigger className="h-14 w-full rounded-2xl sm:w-[220px] border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 p-2 max-h-[300px]">
                <SelectItem value="all" className="rounded-xl font-bold">
                  All branches
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="rounded-xl font-bold">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Button
            variant="outline"
            className="h-14 w-14 rounded-2xl shrink-0 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all"
            onClick={onRefresh}
          >
            <RefreshCw className={cn('h-5 w-5 text-slate-500', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </section>
  );
}
