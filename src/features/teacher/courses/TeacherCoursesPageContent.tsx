'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';
import { TeacherCoursesStats } from './TeacherCoursesStats';
import { TeacherCoursesToolbar } from './TeacherCoursesToolbar';
import { TeacherCourseListCard } from './TeacherCourseListCard';
import { TeacherCoursesSkeleton } from './TeacherCoursesSkeleton';
import { useTeacherCourses } from './useTeacherCourses';
import {
  computeTeacherCoursesSummary,
  filterTeacherCourses,
  sortTeacherCourses,
  type TeacherCourseSort,
} from './teacher-courses-list-utils';

export function TeacherCoursesPageContent() {
  const { user, authChecked, isTeacher } = useTeacherSession();
  const userId = user?.id ?? null;
  const { courses, isLoading, isError, error, refetch } = useTeacherCourses(userId);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<TeacherCourseSort>('recent');

  const summary = useMemo(() => computeTeacherCoursesSummary(courses), [courses]);

  const filtered = useMemo(() => {
    const matched = filterTeacherCourses(courses, search);
    return sortTeacherCourses(matched, sort);
  }, [courses, search, sort]);

  if (!authChecked || isLoading) {
    return <TeacherCoursesSkeleton />;
  }

  if (!userId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <p className="mb-4 font-medium text-slate-600">
          Please log in to see your assigned courses.
        </p>
        <Link href="/login" className="font-black text-indigo-600 hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
        <p className="font-medium text-slate-600">This area is only for teacher accounts.</p>
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

  return (
    <div className="space-y-5 pb-12">
      <p className="max-w-2xl text-sm font-medium text-slate-500">
        Courses where you are assigned as a{' '}
        <strong className="text-slate-700">teacher</strong> or{' '}
        <strong className="text-slate-700">collaborator</strong>.
      </p>

      {courses.length > 0 ? (
        <TeacherCoursesStats
          total={summary.total}
          active={summary.active}
          online={summary.online}
          enrollments={summary.enrollments}
        />
      ) : null}

      <TeacherCoursesToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />

      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-lg font-bold text-slate-700">No courses assigned yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Ask an administrator to assign you on the course Info tab, or add you as a
            collaborator.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 py-14 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No courses match &ldquo;{search.trim()}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <TeacherCourseListCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
