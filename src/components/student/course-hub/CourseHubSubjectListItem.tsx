import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubjectRow } from './course-hub-types';

const TILE_COLORS = [
  'bg-indigo-50 text-indigo-600 ring-indigo-100',
  'bg-emerald-50 text-emerald-600 ring-emerald-100',
  'bg-amber-50 text-amber-600 ring-amber-100',
  'bg-violet-50 text-violet-600 ring-violet-100',
  'bg-sky-50 text-sky-600 ring-sky-100',
  'bg-rose-50 text-rose-600 ring-rose-100',
];

type Props = {
  row: SubjectRow;
  href: string;
  featured?: boolean;
  colorIndex: number;
};

export function CourseHubSubjectListItem({ row, href, featured, colorIndex }: Props) {
  const showBar = row.stats.progressPct > 0;
  const isComplete = row.stats.progressPct >= 100;
  const ctaLabel = featured
    ? 'Resume'
    : isComplete
      ? 'Review'
      : row.stats.progressPct > 0
        ? 'Continue'
        : 'Start';
  const tileColor = TILE_COLORS[colorIndex % TILE_COLORS.length];
  const initial = row.title.trim().charAt(0).toUpperCase() || '?';

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
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold ring-1 sm:h-14 sm:w-14',
          tileColor,
        )}
      >
        {initial}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {isComplete ? (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Completed
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-indigo-700 sm:text-[17px]">
          {row.title}
        </h3>

        <p className="text-xs text-slate-500">
          {row.stats.chapters} chapters · {row.stats.videos} videos
        </p>

        {showBar ? (
          <div className="flex max-w-md items-center gap-3">
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={row.stats.progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-emerald-500' : 'bg-indigo-500',
                )}
                style={{ width: `${row.stats.progressPct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
              {row.stats.progressPct}%
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Tap to start this subject</p>
        )}
      </div>

      <div className="flex shrink-0 items-center self-center">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-indigo-600 sm:px-3.5">
          <span className="hidden sm:inline">{ctaLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
