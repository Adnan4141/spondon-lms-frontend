import Link from 'next/link';
import { ArrowLeft, ArrowRight, GraduationCap, Play } from 'lucide-react';
import type { CourseDetails } from '@/types/course';
import type { StudentMyCourseFlatRow } from '@/lib/student-my-courses';
import type { ResumeLesson } from './course-hub-types';
import { CourseThumbnail } from '@/components/student/courses/CourseThumbnail';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import { cn } from '@/lib/utils';

type Props = {
  course: CourseDetails;
  courseProgress: number;
  resume: ResumeLesson | null;
  enrollment?: StudentMyCourseFlatRow | null;
};

export function CourseHubHero({ course, courseProgress, resume, enrollment }: Props) {
  const isComplete = courseProgress >= 100;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 shadow-sm">
      <div className="p-4 sm:p-5">
        <Link
          href="/student/courses"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          My Courses
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative mx-auto h-[88px] w-full max-w-[140px] shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:mx-0 sm:h-20 sm:w-[112px]">
            <CourseThumbnail
              src={
                course.thumbnail ? resolveAttachmentUrl(course.thumbnail, API_ORIGIN) : null
              }
              alt={course.name}
              sizes="112px"
              priority
            />
            {resume && !isComplete ? (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                <Play className="h-2.5 w-2.5 fill-current" />
                Resume
              </span>
            ) : null}
            {isComplete ? (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                Done
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {course.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                {enrollment?.batch?.name ? (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {enrollment.batch.name}
                  </span>
                ) : null}
                {enrollment?.billingType === 'MONTHLY' ? (
                  <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                    Monthly
                    {enrollment.billingStartMonth ? ` · ${enrollment.billingStartMonth}` : ''}
                  </span>
                ) : null}
                {course.program?.name ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    <GraduationCap className="h-3 w-3" />
                    {course.program.name}
                  </span>
                ) : null}
                {course.grade ? (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {course.grade}
                  </span>
                ) : null}
                {course.group ? (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {course.group}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="max-w-md space-y-1.5 sm:mx-0 mx-auto">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Overall progress</span>
                <span
                  className={cn(
                    'tabular-nums',
                    isComplete ? 'text-emerald-600' : 'text-indigo-600',
                  )}
                >
                  {courseProgress}%
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-200/80"
                role="progressbar"
                aria-valuenow={courseProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isComplete ? 'bg-emerald-500' : 'bg-indigo-500',
                  )}
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
              {courseProgress === 0 ? (
                <p className="text-xs text-slate-400">Start your first lesson below</p>
              ) : null}
            </div>

            {resume ? (
              <Link
                href={resume.href}
                title={resume.lessonTitle}
                className="inline-flex max-w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:justify-start"
              >
                <Play className="h-4 w-4 shrink-0 fill-current" />
                <span className="truncate">
                  {isComplete ? 'Review' : 'Resume'}: {resume.lessonTitle}
                </span>
                <ArrowRight className="hidden h-4 w-4 shrink-0 sm:block" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
