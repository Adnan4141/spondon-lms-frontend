'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoubtCard } from '@/features/community/components/DoubtCard';
import { useToast } from '@/hooks/use-toast';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';
import { cn } from '@/lib/utils';
import {
  useTeacherDoubts,
  type TeacherDoubtQueueFilter,
  type TeacherDoubtStatusFilter,
} from './useTeacherDoubts';

const STATUS_OPTIONS: { value: TeacherDoubtStatusFilter; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'all', label: 'All' },
];

const QUEUE_OPTIONS: { value: TeacherDoubtQueueFilter; label: string }[] = [
  { value: 'needs_response', label: 'Needs response' },
  { value: 'all', label: 'All questions' },
];

export function TeacherDoubtsPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user, authChecked } = useTeacherSession();
  const initialCourse = searchParams.get('courseId') || 'all';

  const [statusFilter, setStatusFilter] = useState<TeacherDoubtStatusFilter>('OPEN');
  const [queueFilter, setQueueFilter] = useState<TeacherDoubtQueueFilter>('needs_response');
  const [courseFilter, setCourseFilter] = useState(initialCourse);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (initialCourse !== 'all') setCourseFilter(initialCourse);
  }, [initialCourse]);

  const filters = useMemo(
    () => ({
      status: statusFilter,
      courseId: courseFilter,
      search: debouncedSearch,
      queue: queueFilter,
    }),
    [statusFilter, courseFilter, debouncedSearch, queueFilter],
  );

  const { courses, doubts, loading, error } = useTeacherDoubts(user?.id, filters);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load doubts',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (!authChecked) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const subtitle =
    queueFilter === 'needs_response'
      ? 'Open questions waiting for your answer.'
      : 'Questions from students in your assigned courses.';

  return (
    <div className="space-y-6 pb-12">
      <p className="max-w-2xl text-slate-500">{subtitle}</p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="h-11 rounded-xl border-slate-200 pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {QUEUE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setQueueFilter(opt.value)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  queueFilter === opt.value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all',
                  statusFilter === opt.value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : doubts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
            <HelpCircle className="h-10 w-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No doubts match these filters</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            {queueFilter === 'needs_response'
              ? 'Great work — no open questions need your response right now.'
              : 'Try changing the status or course filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map((doubt) => (
            <Link key={doubt.id} href={`/teacher/doubts/${doubt.id}`} className="block">
              <DoubtCard
                thread={doubt}
                actions={
                  doubt.status === 'OPEN' && !doubt.hasTeacherReply ? (
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                      Needs reply
                    </span>
                  ) : null
                }
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
