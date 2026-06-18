import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import type { StudentMyCourseWithProgress } from '@/lib/query/hooks/useStudentMyCourses';
import { CourseThumbnail } from './CourseThumbnail';

type Props = {
  course: StudentMyCourseWithProgress;
  featured?: boolean;
};

export function StudentCourseListItem({ course, featured }: Props) {
  const href = `/student/courses/${course.course.slug ?? course.courseId}`;
  const progress = course.progress;
  const hasProgress = progress !== null && progress !== undefined;
  const showBar = hasProgress && progress > 0;
  const isComplete = hasProgress && progress >= 100;
  const ctaLabel = featured ? 'Resume' : isComplete ? 'Review' : hasProgress && progress > 0 ? 'Continue' : 'Start';

  return (
    <Link
      href={href}
      className={cn(
        'group flex gap-4 rounded-xl border bg-white p-3 transition-all duration-200 sm:gap-5 sm:p-4',
        'hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
        featured
          ? 'border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-100/80'
          : 'border-slate-200/90',
      )}
    >
      <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-20 sm:w-[112px]">
        <CourseThumbnail
          src={course.course.thumbnail ? resolveAttachmentUrl(course.course.thumbnail, API_ORIGIN) : null}
          alt={course.course.name}
          sizes="112px"
          priority={featured}
        />
        {featured ? (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Play className="h-2.5 w-2.5 fill-current" />
            Resume
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {course.batch?.name ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {course.batch.name}
            </span>
          ) : null}
          {course.billingType === 'MONTHLY' ? (
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
              Monthly{course.billingStartMonth ? ` · ${course.billingStartMonth}` : ''}
            </span>
          ) : null}
          {isComplete ? (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Completed
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-indigo-700 sm:text-[17px]">
          {course.course.name}
        </h3>

        {showBar ? (
          <div className="flex max-w-md items-center gap-3">
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
              {progress}%
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Tap to open course materials</p>
        )}
      </div>

      <div className="hidden shrink-0 items-center self-center sm:flex">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-indigo-600">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
