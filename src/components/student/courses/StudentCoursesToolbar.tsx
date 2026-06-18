import Link from 'next/link';
import { Compass, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CourseSortOption = 'recent' | 'name' | 'progress';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: CourseSortOption;
  onSortChange: (value: CourseSortOption) => void;
};

export function StudentCoursesToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 border-slate-200 bg-slate-50/50 pl-9 text-sm focus-visible:bg-white"
          aria-label="Search courses"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CourseSortOption)}
          className={cn(
            'h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium text-slate-700',
            'focus-visible:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/60',
          )}
          aria-label="Sort courses"
        >
          <option value="recent">Most recent</option>
          <option value="name">Name (A–Z)</option>
          <option value="progress">Highest progress</option>
        </select>

        <Link
          href="/courses"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Compass className="h-3.5 w-3.5" />
          Browse
        </Link>
      </div>
    </div>
  );
}
