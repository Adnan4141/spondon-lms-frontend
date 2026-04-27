'use client';

import { Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BranchOption } from '../types';
import { StudentAdminSelect } from './StudentAdminSelect';

export function StudentsToolbar({
  count,
  search,
  onSearchChange,
  programFilter,
  onProgramFilterChange,
  batchFilter,
  onBatchFilterChange,
  batchesForProgram,
  branchFilter,
  onBranchFilterChange,
  statusFilter,
  onStatusFilterChange,
  programs,
  branches,
  onAddStudent,
}: {
  count: number;
  search: string;
  onSearchChange: (value: string) => void;
  programFilter: string;
  onProgramFilterChange: (value: string) => void;
  batchFilter: string;
  onBatchFilterChange: (value: string) => void;
  batchesForProgram: { id: string; name: string; course?: { name?: string } }[];
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  programs: { id: string; name: string }[];
  branches: BranchOption[];
  onAddStudent: () => void;
}) {
  const programSelected = programFilter !== 'ALL';
  const batchOptions = [
    { value: 'ALL', label: 'All batches' },
    ...batchesForProgram.map((b) => ({
      value: b.id,
      label: b.course?.name ? `${b.name} — ${b.course.name}` : b.name,
    })),
  ];

  return (
    <div className="px-5 py-4 border-b border-slate-100 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Users className="h-5 w-5 text-slate-400" />
        <h2 className="text-base font-black text-slate-900">Students</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">{count}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <div className="relative min-w-[min(100%,18rem)] flex-1 sm:flex-initial sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search name, mobile, reg no..."
            className="pl-8 w-full sm:w-72 text-sm focus-visible:ring-indigo-400"
          />
        </div>
        <div className="w-[min(100%,11rem)] sm:w-44">
          <StudentAdminSelect
            value={programFilter}
            onChange={onProgramFilterChange}
            options={[{ value: 'ALL', label: 'All programs' }, ...programs.map(p => ({ value: p.id, label: p.name }))]}
          />
        </div>
        <div
          className="w-[min(100%,12rem)] sm:min-w-[12rem] sm:max-w-[20rem] sm:w-auto"
          title={!programSelected ? 'Choose a program first' : 'Batches for courses under the selected program'}
        >
          <StudentAdminSelect
            value={batchFilter}
            onChange={onBatchFilterChange}
            options={batchOptions}
            disabled={!programSelected}
          />
        </div>
        <div className="w-[min(100%,11rem)] sm:w-40">
          <StudentAdminSelect
            value={branchFilter}
            onChange={onBranchFilterChange}
            options={[{ value: 'ALL', label: 'All branches' }, ...branches.map(b => ({ value: b.id, label: b.name }))]}
          />
        </div>
        <div className="w-[min(100%,9rem)] sm:w-36">
          <StudentAdminSelect
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[{ value: 'ALL', label: 'All status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'BLOCKED', label: 'Blocked' }]}
          />
        </div>
        <Button onClick={onAddStudent} className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all shrink-0">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>
    </div>
    <p className="text-[11px] text-slate-500 pl-0.5">
      Program filters students by enrollment in that program. After you pick a program, the batch list loads batches for
      that program’s courses; choosing a batch narrows to students enrolled in that batch.
    </p>
    </div>
  );
}
