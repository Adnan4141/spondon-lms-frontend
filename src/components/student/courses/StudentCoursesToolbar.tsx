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
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:p-4.5">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 border-slate-200 bg-slate-50/50 pl-10.5 text-sm focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100 transition-all rounded-xl"
          aria-label="Search courses"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CourseSortOption)}
          className={cn(
            'h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-bold text-slate-600 cursor-pointer transition-all',
            'hover:bg-slate-100/50 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100',
          )}
          aria-label="Sort courses"
        >
          <option value="recent">Most recent</option>
          <option value="name">Name (A–Z)</option>
          <option value="progress">Highest progress</option>
        </select>

        <Link
          href="/courses"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-4.5 text-sm font-bold tracking-wide text-white shadow-md shadow-indigo-500/10 transition-all duration-200 hover:shadow-indigo-500/20 active:scale-[0.98]"
        >
          <Compass className="h-4 w-4" />
          Browse
        </Link>
      </div>
    </div>
  );
}
