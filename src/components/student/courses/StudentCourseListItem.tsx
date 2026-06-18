import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
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
        'group flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-300 shadow-sm',
        'hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
        featured
          ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/10 via-white to-white ring-1 ring-indigo-100/50'
          : 'border-slate-200/80',
      )}
    >
      {/* Thumbnail Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <CourseThumbnail
            src={course.course.thumbnail ? resolveAttachmentUrl(course.course.thumbnail, API_ORIGIN) : null}
            alt={course.course.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={featured}
          />
        </div>
        
        {/* Floating status badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          {featured ? (
            <span className="flex items-center gap-1 rounded-full bg-indigo-600/90 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm border border-indigo-400/20">
              <Play className="h-2 w-2 fill-current" />
              Resume
            </span>
          ) : null}
          {isComplete ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm border border-emerald-400/20">
              Completed
            </span>
          ) : null}
        </div>
      </div>

      {/* Card Content body */}
      <div className="flex flex-1 flex-col p-4 justify-between gap-4">
        <div className="space-y-2.5">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {course.batch?.name ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200/30">
                {course.batch.name}
              </span>
            ) : null}
            {course.billingType === 'MONTHLY' ? (
              <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[9px] font-bold text-violet-700 border border-violet-100">
                Monthly{course.billingStartMonth ? ` · ${course.billingStartMonth}` : ''}
              </span>
            ) : null}
          </div>

          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700">
            {course.course.name}
          </h3>
        </div>

        {/* Progress Bar & Footer CTA */}
        <div className="space-y-3">
          {showBar ? (
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 border border-slate-200/50"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all relative',
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_4px_rgba(99,102,241,0.3)]',
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">
                {progress}%
              </span>
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-400">Start learning today</p>
          )}

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Course materials
            </span>
            <span
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300',
                featured
                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                  : 'bg-slate-900 text-white group-hover:bg-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-500/20'
              )}
            >
              {ctaLabel}
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
