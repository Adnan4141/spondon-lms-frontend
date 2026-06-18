import type { BatchStatusType } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BATCH_STATUS_OPTIONS } from '../batches-page-utils';

type BatchesFiltersBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: BatchStatusType | 'all';
  onStatusFilterChange: (value: BatchStatusType | 'all') => void;
  courseFilter: string;
  onCourseFilterChange: (value: string) => void;
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  courses: Course[];
  branches: Branch[];
  showBranchFilter: boolean;
  loading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onCreateBatch: () => void;
};

export function BatchesFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  courseFilter,
  onCourseFilterChange,
  branchFilter,
  onBranchFilterChange,
  courses,
  branches,
  showBranchFilter,
  loading,
  isFetching,
  onRefresh,
  onCreateBatch,
}: BatchesFiltersBarProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_48px] lg:items-center">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search batches, courses, or branches..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner sm:text-base"
              />
            </div>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as BatchStatusType | 'all')}
          >
            <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
              {BATCH_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-sm font-medium">
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={courseFilter} onValueChange={onCourseFilterChange}>
            <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
              <SelectItem value="all" className="text-sm font-medium">
                All Courses
              </SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id} className="text-sm font-medium">
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showBranchFilter ? (
            <Select value={branchFilter} onValueChange={onBranchFilterChange}>
              <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">
                  All Branches
                </SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-sm font-medium">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm sm:w-12"
            onClick={onRefresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading || isFetching ? 'animate-spin' : ''}`} />
            <span className="ml-2 text-xs font-bold uppercase tracking-widest sm:hidden">Refresh</span>
          </Button>
        </div>

        <Button
          className="h-12 w-full rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 sm:w-auto"
          onClick={onCreateBatch}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Batch
        </Button>
      </div>
    </section>
  );
}
