'use client';

import { Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BranchOption } from './types';
import { StudentAdminSelect } from './StudentAdminSelect';

export function StudentsToolbar({
  count,
  search,
  onSearchChange,
  branchFilter,
  onBranchFilterChange,
  statusFilter,
  onStatusFilterChange,
  branches,
  onAddStudent,
}: {
  count: number;
  search: string;
  onSearchChange: (value: string) => void;
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  branches: BranchOption[];
  onAddStudent: () => void;
}) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Users className="h-5 w-5 text-slate-400" />
        <h2 className="text-base font-black text-slate-900">Students</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">{count}</span>
      </div>
      <div className="flex items-center gap-2 ">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search name, mobile, reg no..."
            className="pl-8 w-72 text-sm focus-visible:ring-indigo-400"
          />
        </div>
        <StudentAdminSelect
          value={branchFilter}
          onChange={onBranchFilterChange}
          options={[{ value: 'ALL', label: 'All Branches' }, ...branches.map(b => ({ value: b.id, label: b.name }))]}
        />
        <StudentAdminSelect
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[{ value: 'ALL', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'BLOCKED', label: 'Blocked' }]}
        />
        <Button onClick={onAddStudent} className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>
    </div>
  );
}
