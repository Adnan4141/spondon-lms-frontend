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
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl shadow-slate-900/10 transition-all duration-300">
      {/* Background glowing effects */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Abstract Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-5 sm:p-6 z-10">
        <Link
          href="/student/courses"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          My Courses
        </Link>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="group relative mx-auto h-[100px] w-full max-w-[150px] shrink-0 overflow-hidden rounded-2xl border-2 border-white/10 bg-slate-800/50 shadow-md sm:mx-0 sm:h-24 sm:w-[130px] transition-all duration-300 hover:border-indigo-400/40 hover:shadow-indigo-500/20">
            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
              <CourseThumbnail
                src={
                  course.thumbnail ? resolveAttachmentUrl(course.thumbnail, API_ORIGIN) : null
                }
                alt={course.name}
                sizes="130px"
                priority
              />
            </div>
            
            {resume && !isComplete ? (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-indigo-600/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm border border-indigo-400/20">
                <Play className="h-2 w-2 fill-current" />
                Resume
              </span>
            ) : null}
            {isComplete ? (
              <span className="absolute bottom-2 left-2 rounded bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm border border-emerald-400/20">
                Done
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl leading-tight">
                {course.name}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                {enrollment?.batch?.name ? (
                  <span className="rounded-full bg-white/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-slate-200 border border-white/5">
                    {enrollment.batch.name}
                  </span>
                ) : null}
                {enrollment?.billingType === 'MONTHLY' ? (
                  <span className="rounded-full bg-indigo-500/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-indigo-200 border border-indigo-500/30">
                    Monthly
                    {enrollment.billingStartMonth ? ` · ${enrollment.billingStartMonth}` : ''}
                  </span>
                ) : null}
                {course.program?.name ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-slate-200 border border-white/5">
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                    {course.program.name}
                  </span>
                ) : null}
                {course.grade ? (
                  <span className="rounded-full bg-white/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-slate-200 border border-white/5">
                    {course.grade}
                  </span>
                ) : null}
                {course.group ? (
                  <span className="rounded-full bg-white/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-slate-200 border border-white/5">
                    {course.group}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="max-w-md space-y-2 sm:mx-0 mx-auto">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Overall progress</span>
                <span
                  className={cn(
                    'tabular-nums font-extrabold',
                    isComplete ? 'text-emerald-400' : 'text-indigo-400',
                  )}
                >
                  {courseProgress}%
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-white/10 p-[1px] border border-white/5"
                role="progressbar"
                aria-valuenow={courseProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 relative',
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : 'bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]',
                  )}
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
              {courseProgress === 0 ? (
                <p className="text-xs text-slate-500">Start your first lesson below</p>
              ) : null}
            </div>

            {resume ? (
              <div className="pt-1">
                <Link
                  href={resume.href}
                  title={resume.lessonTitle}
                  className="group/btn inline-flex max-w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] sm:justify-start"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 group-hover/btn:bg-white/20 transition-colors">
                    <Play className="h-2.5 w-2.5 fill-current text-white translate-x-[0.5px]" />
                  </span>
                  <span className="truncate">
                    {isComplete ? 'Review' : 'Resume'}: {resume.lessonTitle}
                  </span>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 sm:block transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
