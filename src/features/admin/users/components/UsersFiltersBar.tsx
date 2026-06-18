import type { Branch } from '@/lib/api/branches';
import type { User } from '@/lib/api/users';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UsersFiltersBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  branches: Branch[];
  users: User[];
  pagination: { page: number; limit: number; total: number; pages: number } | null;
};

export function UsersFiltersBar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  branchFilter,
  onBranchFilterChange,
  branches,
  users,
  pagination,
}: UsersFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search name, mobile, email…"
          className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm font-semibold focus:bg-white"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <Select
        value={statusFilter || 'all'}
        onValueChange={(v) => onStatusFilterChange(v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-11 w-38 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="BLOCKED">Blocked</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={branchFilter || 'all'}
        onValueChange={(v) => onBranchFilterChange(v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-11 w-48 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold">
          <SelectValue placeholder="All Branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
        {pagination
          ? users.length > 0
            ? `Rows ${(pagination.page - 1) * pagination.limit + 1}–${(pagination.page - 1) * pagination.limit + users.length} of ${pagination.total}`
            : `0 of ${pagination.total} users`
          : `${users.length} users`}
      </p>
    </div>
  );
}
