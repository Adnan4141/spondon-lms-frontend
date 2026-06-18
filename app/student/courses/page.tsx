'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentMyCourses } from '@/lib/query/hooks/useStudentMyCourses';
import type { StudentMyCourseWithProgress } from '@/lib/query/hooks/useStudentMyCourses';
import { StudentCoursesToolbar, type CourseSortOption } from '@/components/student/courses/StudentCoursesToolbar';
import { StudentCourseListItem } from '@/components/student/courses/StudentCourseListItem';
import { StudentCoursesWelcome } from '@/components/student/courses/StudentCoursesWelcome';
import { StudentCoursesSkeleton } from '@/components/student/courses/StudentCoursesSkeleton';
import { StudentCoursesEmpty } from '@/components/student/courses/StudentCoursesEmpty';

function sortCourses(
  courses: StudentMyCourseWithProgress[],
  sort: CourseSortOption,
): StudentMyCourseWithProgress[] {
  const copy = [...courses];
  if (sort === 'name') {
    return copy.sort((a, b) => a.course.name.localeCompare(b.course.name));
  }
  if (sort === 'progress') {
    return copy.sort((a, b) => (b.progress ?? -1) - (a.progress ?? -1));
  }
  return copy;
}

function pickFeaturedId(courses: StudentMyCourseWithProgress[]): string | null {
  if (courses.length === 0) return null;
  const inProgress = courses.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
  if (inProgress.length > 0) {
    return inProgress.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0].id;
  }
  return courses[0].id;
}

function countByStatus(courses: StudentMyCourseWithProgress[]) {
  let inProgress = 0;
  let completed = 0;
  for (const c of courses) {
    const p = c.progress;
    if (p !== null && p !== undefined) {
      if (p >= 100) completed += 1;
      else if (p > 0) inProgress += 1;
    }
  }
  return { inProgress, completed };
}

export default function StudentMyCoursesPage() {
  const { data: courses = [], isLoading, isError, error, refetch, studentId, authChecked } =
    useStudentMyCourses();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CourseSortOption>('recent');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = q
      ? courses.filter(
          (c) =>
            c.course.name.toLowerCase().includes(q) ||
            (c.batch?.name?.toLowerCase().includes(q) ?? false),
        )
      : courses;
    return sortCourses(matched, sort);
  }, [courses, search, sort]);

  const featuredId = useMemo(
    () => (search.trim() ? null : pickFeaturedId(courses)),
    [courses, search],
  );
  const stats = useMemo(() => countByStatus(courses), [courses]);

  if (!authChecked || isLoading) {
    return <StudentCoursesSkeleton />;
  }

  if (!studentId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="mb-4 text-sm text-slate-600">Please log in to view your courses.</p>
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-10 text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-rose-500" />
        <p className="font-semibold text-slate-900">Could not load courses</p>
        <p className="mt-1 mb-5 text-sm text-slate-600">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <StudentCoursesToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
        />
        <StudentCoursesEmpty />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full space-y-4">
      <StudentCoursesToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />

      {!search.trim() ? (
        <StudentCoursesWelcome stats={stats} total={courses.length} />
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 py-16 text-center">
          <p className="text-sm font-semibold text-slate-400">No courses match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <StudentCourseListItem
              key={course.id}
              course={course}
              featured={course.id === featuredId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
