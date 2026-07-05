import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TeacherCourseSort } from './teacher-courses-list-utils';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: TeacherCourseSort;
  onSortChange: (value: TeacherCourseSort) => void;
};

const selectClass = cn(
  'h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-bold text-slate-600 cursor-pointer transition-all',
  'hover:bg-slate-100/50 focus-visible:border-indigo-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100',
);

export function TeacherCoursesToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:p-4">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search by course name, slug, or program..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm transition-all focus-visible:border-indigo-400 focus-visible:bg-white focus-visible:ring-indigo-100"
          aria-label="Search courses"
        />
      </div>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as TeacherCourseSort)}
        className={cn(selectClass, 'w-full sm:w-auto sm:min-w-[10rem]')}
        aria-label="Sort courses"
      >
        <option value="recent">Most recent</option>
        <option value="name">Name (A–Z)</option>
        <option value="enrollments">Most enrolled</option>
      </select>
    </div>
  );
}
