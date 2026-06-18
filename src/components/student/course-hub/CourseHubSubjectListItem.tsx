import Link from 'next/link';
import { ArrowRight, BookOpen, Film, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubjectRow } from './course-hub-types';

const GRADIENT_TILES = [
  'from-indigo-500 to-blue-600 text-white shadow-indigo-500/15',
  'from-emerald-400 to-teal-600 text-white shadow-emerald-500/15',
  'from-amber-400 to-orange-500 text-white shadow-orange-500/15',
  'from-violet-500 to-purple-600 text-white shadow-purple-500/15',
  'from-sky-400 to-cyan-500 text-white shadow-cyan-500/15',
  'from-rose-500 to-pink-600 text-white shadow-rose-500/15',
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
  
  const tileGradient = GRADIENT_TILES[colorIndex % GRADIENT_TILES.length];
  const initial = row.title.trim().charAt(0).toUpperCase() || '?';

  return (
    <Link
      href={href}
      className={cn(
        'group flex gap-4 rounded-2xl border bg-white p-4 transition-all duration-300 sm:gap-5',
        'hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
        featured
          ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/20 to-white ring-1 ring-indigo-100/50'
          : 'border-slate-200/80',
      )}
    >
      {/* Dynamic Gradient Tile */}
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black bg-gradient-to-br shadow-md sm:h-14 sm:w-14 transition-transform duration-300 group-hover:scale-105',
          tileGradient
        )}
      >
        {initial}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {featured ? (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
              Active Learning
            </span>
          ) : null}
          {isComplete ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Completed
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700 sm:text-[17px]">
          {row.title}
        </h3>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-slate-300" />
            {row.stats.chapters} chapters
          </span>
          <span className="text-slate-200">•</span>
          <span className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5 text-slate-300" />
            {row.stats.videos} videos
          </span>
        </div>

        {showBar ? (
          <div className="flex max-w-sm items-center gap-3 mt-1">
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 border border-slate-200/50"
              role="progressbar"
              aria-valuenow={row.stats.progressPct}
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
                style={{ width: `${row.stats.progressPct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">
              {row.stats.progressPct}%
            </span>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-400 mt-1">Tap to begin this subject</p>
        )}
      </div>

      <div className="flex shrink-0 items-center self-center pl-1">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300',
            featured
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 group-hover:bg-indigo-700'
              : 'bg-slate-900 text-white group-hover:bg-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-500/20'
          )}
        >
          <span className="hidden sm:inline">{ctaLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
