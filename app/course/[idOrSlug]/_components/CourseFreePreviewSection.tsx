'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Lock,
  MonitorPlay,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseFreePreviewItem } from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import { isYoutubeContentUrl, parseYoutubeVideoId } from '@/lib/youtube';
import { curriculumContentTypeLabel } from '@/types/course';
import { sanitizeRichTextDisplayHtml } from '@/lib/sanitize-rich-text-display';

const YoutubePlayer = dynamic(
  () => import('@/components/student/course/YoutubePlayer').then((m) => m.YoutubePlayer),
  { ssr: false, loading: () => <PlayerSkeleton /> },
);

const HostedVideoPlayer = dynamic(
  () => import('@/components/student/course/HostedVideoPlayer').then((m) => m.HostedVideoPlayer),
  { ssr: false, loading: () => <PlayerSkeleton /> },
);

type Props = {
  items: CourseFreePreviewItem[];
  courseName: string;
};

function PlayerSkeleton() {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-slate-950">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    </div>
  );
}

function resolveMediaUrl(url: string): string {
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url;
}

function formatDuration(min: number | null) {
  if (min == null || min <= 0) return null;
  if (min >= 60) return `${Math.floor(min / 60)}ঘ ${min % 60}মি`;
  return `${min} মি`;
}

function lessonThumbnail(item: CourseFreePreviewItem): string | null {
  const raw = item.fileUrl?.trim() || '';
  if (!raw || !isYoutubeContentUrl(raw)) return null;
  const id = parseYoutubeVideoId(raw);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function PreviewMedia({
  item,
  courseName,
}: {
  item: CourseFreePreviewItem;
  courseName: string;
}) {
  const rawUrl = item.fileUrl?.trim() || '';
  const resolvedUrl = rawUrl ? resolveMediaUrl(rawUrl) : '';
  const embedYoutubeId =
    rawUrl && isYoutubeContentUrl(rawUrl) ? parseYoutubeVideoId(rawUrl) : null;
  const ytBroken = !!(rawUrl && isYoutubeContentUrl(rawUrl) && !embedYoutubeId);
  const treatAsPdf =
    item.type === 'PDF' ||
    item.type === 'SYLLABUS' ||
    item.type === 'LEAFLET' ||
    item.type === 'SAMPLE' ||
    (rawUrl && /\.pdf(\?|#|$)/i.test(rawUrl));

  if (ytBroken) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center bg-slate-950 px-6 text-center text-amber-200/90">
        <AlertTriangle className="mb-3 h-10 w-10 text-amber-400" />
        <p className="font-bold">ভিডিও লোড করা যাচ্ছে না</p>
      </div>
    );
  }

  if (embedYoutubeId) {
    return (
      <div className="aspect-video w-full">
        <YoutubePlayer
          key={item.id}
          videoId={embedYoutubeId}
          courseTitle={item.title}
          studentName={`ফ্রি প্রিভিউ · ${courseName}`}
        />
      </div>
    );
  }

  if (treatAsPdf && resolvedUrl) {
    return (
      <iframe
        title={item.title}
        src={resolvedUrl}
        className="aspect-4/3 w-full min-h-[360px] border-0 bg-white sm:aspect-video sm:min-h-0"
      />
    );
  }

  if (item.type === 'VIDEO' && resolvedUrl) {
    return (
      <div className="aspect-video w-full">
        <HostedVideoPlayer
          key={item.id}
          contentId={item.id}
          src={resolvedUrl}
          studentName={`ফ্রি প্রিভিউ · ${courseName}`}
        />
      </div>
    );
  }

  if (item.textBody) {
    return (
      <div
        className="prose prose-slate max-h-[480px] max-w-none overflow-y-auto p-6 sm:p-8"
        dangerouslySetInnerHTML={{ __html: sanitizeRichTextDisplayHtml(item.textBody) }}
      />
    );
  }

  if (resolvedUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-linear-to-b from-slate-900 to-slate-950 px-6 text-slate-200">
        <FileText className="h-10 w-10 text-indigo-400" />
        <p className="max-w-sm text-center font-bold text-slate-100">{item.title}</p>
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"
        >
          রিসোর্স খুলুন
        </a>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center bg-slate-950 text-slate-400">
      <Play className="h-12 w-12 animate-pulse" />
    </div>
  );
}

export function CourseFreePreviewSection({ items, courseName }: Props) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  if (items.length === 0 || !selected) return null;

  const totalDuration = items.reduce((sum, i) => sum + (i.durationMinutes ?? 0), 0);

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl" />

      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <MonitorPlay size={24} strokeWidth={2.25} />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[9px] font-black text-white">
                {items.length}
              </span>
            </div>
            <div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
                ফ্রি প্রিভিউ
              </span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-[1.65rem]">
                কেনার আগে ফ্রি ক্লাস দেখুন
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-500">
                {items.length}টি লেকচার এনরোলমেন্ট ছাড়াই দেখুন
                {totalDuration > 0 ? ` · মোট ${formatDuration(totalDuration)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-left sm:max-w-[220px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
              <Lock className="h-4 w-4" />
            </div>
            <p className="text-[11px] font-semibold leading-snug text-slate-500">
              বাকি সব ক্লাস ও রিসোর্স এনরোল করলে আনলক হবে
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-7">
          {/* Player column */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-[30px] bg-linear-to-br from-emerald-400/20 via-transparent to-indigo-400/20 opacity-80 blur-sm transition-opacity group-hover:opacity-100" />
              <div className="relative overflow-hidden rounded-[26px] bg-slate-950 shadow-2xl shadow-slate-300/50 ring-1 ring-slate-900/10">
                <PreviewMedia item={selected} courseName={courseName} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                  ফ্রি
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200">
                  {curriculumContentTypeLabel(selected.type)}
                </span>
                {formatDuration(selected.durationMinutes) ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                    <Clock className="h-3 w-3" />
                    {formatDuration(selected.durationMinutes)}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-black leading-snug tracking-tight text-slate-900 sm:text-xl">
                {selected.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{courseName}</p>
              {selected.subjectTitle || selected.chapterTitle ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {[selected.subjectTitle, selected.chapterTitle].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>

          {/* Playlist column */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100/80">
              <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  প্লেলিস্ট
                </p>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <p className="text-base font-black text-slate-900">ফ্রি ক্লাসসমূহ</p>
                  <span className="text-xs font-bold text-emerald-600">{items.length}টি</span>
                </div>
              </div>

              <div className="flex-1 divide-y divide-slate-50 overflow-y-auto max-h-[min(440px,55vh)]">
                {items.map((item, index) => {
                  const active = item.id === selected.id;
                  const thumb = lessonThumbnail(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        'group/item relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200',
                        active ? 'bg-emerald-50/80' : 'hover:bg-slate-50',
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-emerald-500" />
                      ) : null}

                      <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-200/80">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover opacity-90 transition group-hover/item:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-800 to-slate-900">
                            <Play className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'absolute inset-0 flex items-center justify-center transition',
                            active ? 'bg-emerald-950/40' : 'bg-slate-950/30 group-hover/item:bg-slate-950/20',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full',
                              active
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                : 'bg-white/90 text-slate-700 opacity-0 group-hover/item:opacity-100',
                            )}
                          >
                            <Play className="h-3 w-3 translate-x-px" fill="currentColor" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-px text-[8px] font-bold text-white">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <p
                          className={cn(
                            'line-clamp-2 text-[13px] font-bold leading-snug',
                            active ? 'text-emerald-950' : 'text-slate-800',
                          )}
                        >
                          {item.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {curriculumContentTypeLabel(item.type)}
                          </span>
                          {formatDuration(item.durationMinutes) ? (
                            <span className="text-[10px] font-medium text-slate-400">
                              {formatDuration(item.durationMinutes)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {active ? (
                        <span className="shrink-0 self-start rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                          চলছে
                        </span>
                      ) : (
                        <span className="shrink-0 self-start text-[9px] font-bold uppercase text-emerald-600/80">
                          ফ্রি
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() =>
            document.getElementById('course-sidebar-enroll')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          className="group flex w-full items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-[#5C2D91] to-[#7A3EB2] px-6 py-4 text-left text-white shadow-lg shadow-[#5C2D91]/20 transition hover:shadow-xl hover:shadow-[#5C2D91]/30 active:scale-[0.99]"
        >
          <div>
            <p className="text-sm font-bold text-white/90">সব ক্লাস, নোট ও এক্সাম অ্যাক্সেস করুন</p>
            <p className="mt-0.5 text-xs font-medium text-white/65">ফুল কোর্সে ভর্তি হয়ে আনলিমিটেড শিখুন</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-black backdrop-blur-sm transition group-hover:bg-white/25">
            এনরোল করুন
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </section>
  );
}
