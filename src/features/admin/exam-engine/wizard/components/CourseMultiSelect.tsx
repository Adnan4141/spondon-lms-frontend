'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';

type Props = {
  courses: Course[];
  value: string[];
  onChange: (courseIds: string[]) => void;
  invalid?: boolean;
};

export function CourseMultiSelect({ courses, value, onChange, invalid }: Props) {
  const selectedCourses = value
    .map((id) => courses.find((course) => course.id === id))
    .filter((course): course is Course => Boolean(course));

  const toggleCourse = (courseId: string) => {
    if (value.includes(courseId)) {
      onChange(value.filter((id) => id !== courseId));
      return;
    }
    onChange([...value, courseId]);
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-auto min-h-11 w-full justify-between border-slate-200 bg-white px-3 py-2 text-left font-medium',
              invalid && 'border-rose-400',
            )}
          >
            <span className="truncate">
              {selectedCourses.length ? `${selectedCourses.length} course${selectedCourses.length === 1 ? '' : 's'} selected` : 'Select courses'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search courses..." />
            <CommandList>
              <CommandEmpty>No courses found.</CommandEmpty>
              {courses.map((course) => {
                const checked = value.includes(course.id);
                return (
                  <CommandItem
                    key={course.id}
                    value={course.name}
                    onSelect={() => toggleCourse(course.id)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300',
                        checked && 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]',
                      )}
                    >
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{course.name}</span>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCourses.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedCourses.map((course, index) => (
            <Badge
              key={course.id}
              variant={index === 0 ? 'default' : 'secondary'}
              className={cn(
                'gap-1 rounded-md px-2 py-1 text-xs',
                index === 0 && 'bg-[#0D1B35] text-[#E2C98A]',
              )}
            >
              {course.name}
              {index === 0 ? <span className="opacity-75">Primary</span> : null}
              <button
                type="button"
                className="ml-1 rounded-sm opacity-70 transition hover:opacity-100"
                onClick={() => onChange(value.filter((id) => id !== course.id))}
                aria-label={`Remove ${course.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-slate-500">
        First selected course is used as the primary course for folders and defaults.
      </p>
    </div>
  );
}
