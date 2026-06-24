'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';

type Props = {
  courses: Course[];
  value: string[];
  primaryCourseId: string;
  onChange: (courseIds: string[]) => void;
  invalid?: boolean;
  disabled?: boolean;
};

function isCourseSelectable(course: Course): boolean {
  return course.status === 'ACTIVE';
}

export function CourseMultiSelect({
  courses,
  value,
  primaryCourseId,
  onChange,
  invalid,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedCourses = useMemo(
    () =>
      value
        .map((id) => courses.find((course) => course.id === id))
        .filter((course): course is Course => Boolean(course)),
    [courses, value],
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return courses;

    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(normalizedQuery) ||
        course.slug.toLowerCase().includes(normalizedQuery),
    );
  }, [courses, query]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const toggleCourse = (courseId: string) => {
    const course = courses.find((item) => item.id === courseId);
    if (!course || !isCourseSelectable(course)) return;

    if (value.includes(courseId)) {
      onChange(value.filter((id) => id !== courseId));
      return;
    }
    onChange([...value, courseId]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || courses.length === 0}
            className={cn(
              'h-auto min-h-11 w-full justify-between rounded-lg border-slate-200 bg-white px-3 py-2 text-left font-medium text-slate-900 hover:bg-slate-50',
              !selectedCourses.length && 'text-slate-500',
              invalid && 'border-rose-400 ring-1 ring-rose-200',
            )}
          >
            <span className="truncate">
              {courses.length === 0
                ? 'No courses available'
                : selectedCourses.length
                  ? `${selectedCourses.length} course${selectedCourses.length === 1 ? '' : 's'} selected`
                  : 'Select courses'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden rounded-xl border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
          align="start"
          onWheelCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses..."
                className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-100"
              />
            </div>
          </div>

          <div className="max-h-[min(18rem,var(--radix-popover-content-available-height,18rem))] overflow-y-auto overscroll-contain p-1 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
            {filteredCourses.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm font-medium text-slate-500">No courses found.</p>
            ) : (
              filteredCourses.map((course) => {
                const checked = value.includes(course.id);
                const selectable = isCourseSelectable(course);

                return (
                  <button
                    key={course.id}
                    type="button"
                    disabled={!selectable}
                    onClick={() => toggleCourse(course.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      selectable
                        ? 'cursor-pointer text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none'
                        : 'cursor-not-allowed text-slate-400 opacity-60',
                      checked && selectable && 'bg-[#0D1B35]/5 hover:bg-[#0D1B35]/8',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked
                          ? 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]'
                          : 'border-slate-300 bg-white',
                        !selectable && 'border-slate-200 bg-slate-50',
                      )}
                      aria-hidden
                    >
                      {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                    </span>

                    <span className="min-w-0 flex-1 truncate font-medium leading-snug">{course.name}</span>

                    {!selectable ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {course.status === 'ARCHIVED' ? 'Archived' : 'Inactive'}
                      </span>
                    ) : course.type ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {course.type}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedCourses.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedCourses.map((course) => {
            const isPrimary = course.id === primaryCourseId;
            const showPrimaryLabel = selectedCourses.length > 1 && isPrimary;

            return (
              <Badge
                key={course.id}
                variant={showPrimaryLabel ? 'default' : 'secondary'}
                className={cn(
                  'gap-1 rounded-md px-2 py-1 text-xs font-medium',
                  showPrimaryLabel
                    ? 'bg-[#0D1B35] text-[#E2C98A] hover:bg-[#0D1B35]/90'
                    : 'bg-slate-100 text-slate-800',
                )}
              >
                {showPrimaryLabel ? <Star className="h-3 w-3 fill-current" /> : null}
                <span className="max-w-[200px] truncate">{course.name}</span>
                {showPrimaryLabel ? <span className="opacity-75">Primary</span> : null}
                <button
                  type="button"
                  className="ml-1 rounded-sm opacity-70 transition hover:opacity-100"
                  onClick={() => onChange(value.filter((id) => id !== course.id))}
                  aria-label={`Remove ${course.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}

      <p className="text-[11px] text-slate-500">
        {selectedCourses.length > 1
          ? 'Primary course sets branch/batch scope. Students in any selected course can see this exam.'
          : 'Students enrolled in the selected course can see this exam.'}
      </p>
    </div>
  );
}
