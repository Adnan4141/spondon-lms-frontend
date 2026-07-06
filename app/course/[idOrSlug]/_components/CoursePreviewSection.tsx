'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Lock,
  MonitorPlay,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseContentOutline, CourseFreePreviewItem } from '@/lib/api/courses';
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

type PlaylistRow = {
  id: string;
  title: string;
  type: string;
  isFree: boolean;
  durationMinutes: number | null;
  subjectTitle: string;
  chapterTitle: string;
  fileUrl: string | null;
  textBody: string | null;
};

type Props = {
  outline: CourseContentOutline | null;
  freePreview: CourseFreePreviewItem[];
  courseName: string;
  freeSegmentCount?: number;
  totalSegmentCount?: number;
};

function PlayerSkeleton() {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-slate-950">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
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

function scrollToEnroll() {
  document.getElementById('course-sidebar-enroll')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function buildPlaylist(outline: CourseContentOutline | null, freePreview: CourseFreePreviewItem[]): PlaylistRow[] {
  const freeMap = new Map(freePreview.map((f) => [f.id, f]));

  if (outline && outline.subjects.length > 0) {
    const rows: PlaylistRow[] = [];
    for (const sub of outline.subjects) {
      for (const ch of sub.chapters) {
        for (const seg of ch.segments) {
          const free = freeMap.get(seg.id);
          rows.push({
            id: seg.id,
            title: seg.title,
            type: seg.type,
            isFree: seg.isFree,
            durationMinutes: seg.durationMinutes,
            subjectTitle: sub.title,
            chapterTitle: ch.title,
            fileUrl: free?.fileUrl ?? null,
            textBody: free?.textBody ?? null,
          });
        }
      }
    }
    return rows;
  }

  return freePreview.map((f) => ({
    id: f.id,
    title: f.title,
    type: f.type,
    isFree: true,
    durationMinutes: f.durationMinutes,
    subjectTitle: f.subjectTitle ?? 'কোর্স',
    chapterTitle: f.chapterTitle ?? 'সাধারণ',
    fileUrl: f.fileUrl,
    textBody: f.textBody,
  }));
}

function lessonThumbnail(row: PlaylistRow): string | null {
  const raw = row.fileUrl?.trim() || '';
  if (!raw || !isYoutubeContentUrl(raw)) return null;
  const id = parseYoutubeVideoId(raw);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function PreviewMedia({ item, courseName }: { item: PlaylistRow; courseName: string }) {
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
        <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
        <p className="text-sm font-bold">ভিডিও লোড করা যাচ্ছে না</p>
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
        className="aspect-video w-full min-h-[280px] border-0 bg-white"
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
        className="prose prose-slate max-h-[360px] max-w-none overflow-y-auto p-5 sm:p-6"
        dangerouslySetInnerHTML={{ __html: sanitizeRichTextDisplayHtml(item.textBody) }}
      />
    );
  }

  if (resolvedUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-slate-200">
        <FileText className="h-8 w-8 text-indigo-400" />
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
        >
          রিসোর্স খুলুন
        </a>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center bg-slate-950 text-slate-400">
      <Play className="h-10 w-10 animate-pulse" />
    </div>
  );
}

function LockedPlayer({ title }: { title: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 ring-1 ring-slate-700">
        <Lock className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-200 line-clamp-2">{title}</p>
        <p className="mt-1 text-xs text-slate-500">প্রিমিয়াম কন্টেন্ট — এনরোল করলে দেখতে পারবেন</p>
      </div>
      <button
        type="button"
        onClick={scrollToEnroll}
        className="rounded-lg bg-[#5C2D91] px-4 py-2 text-xs font-bold text-white hover:bg-[#6d38a8]"
      >
        এনরোল করুন
      </button>
    </div>
  );
}

/** Compact syllabus-only view when there is no free playable content */
function CompactCurriculumOnly({
  outline,
  freeSegmentCount,
  totalSegmentCount,
}: {
  outline: CourseContentOutline;
  freeSegmentCount: number;
  totalSegmentCount: number;
}) {
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

  return (
    <div className="divide-y divide-slate-100">
      {outline.subjects.map((sub, subIdx) => {
        const open = openSubjects[sub.id] ?? subIdx === 0;
        const segTotal = sub.chapters.reduce((n, ch) => n + ch.segments.length, 0);
        const freeInSub = sub.chapters.reduce(
          (n, ch) => n + ch.segments.filter((s) => s.isFree).length,
          0,
        );

        return (
          <div key={sub.id}>
            <button
              type="button"
              onClick={() => setOpenSubjects((p) => ({ ...p, [sub.id]: !open }))}
              className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{sub.title}</span>
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                {segTotal}টি
                {freeInSub > 0 ? ` · ${freeInSub} ফ্রি` : ''}
              </span>
            </button>

            {open ? (
              <div className="bg-slate-50/50 pb-2">
                {sub.chapters.map((ch) =>
                  ch.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className={cn(
                        'flex items-center gap-2 border-t border-slate-100/80 px-4 py-2 pl-9',
                        !seg.isFree && 'opacity-75',
                      )}
                    >
                      {seg.isFree ? (
                        <Play className="h-3 w-3 shrink-0 text-emerald-500" />
                      ) : (
                        <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-700">
                        {seg.title}
                      </span>
                      {seg.isFree ? (
                        <span className="shrink-0 text-[9px] font-bold text-emerald-600">ফ্রি</span>
                      ) : (
                        <span className="shrink-0 text-[9px] font-medium text-slate-400">লক</span>
                      )}
                    </div>
                  )),
                )}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2 px-4 py-3 text-[10px] font-bold text-slate-400">
        <span>{totalSegmentCount} সেগমেন্ট</span>
        {freeSegmentCount > 0 ? <span className="text-emerald-600">{freeSegmentCount} ফ্রি</span> : null}
      </div>
    </div>
  );
}

export function CoursePreviewSection({
  outline,
  freePreview,
  courseName,
  freeSegmentCount = 0,
  totalSegmentCount = 0,
}: Props) {
  const playlist = useMemo(() => buildPlaylist(outline, freePreview), [outline, freePreview]);
  const hasPlayableFree = freePreview.length > 0;
  const firstFreeId = playlist.find((r) => r.isFree && (r.fileUrl || r.textBody))?.id ?? playlist[0]?.id ?? '';

  const [selectedId, setSelectedId] = useState(firstFreeId);

  const selected = useMemo(
    () => playlist.find((r) => r.id === selectedId) ?? playlist[0] ?? null,
    [playlist, selectedId],
  );

  if (playlist.length === 0) return null;

  const lockedCount = playlist.filter((r) => !r.isFree).length;
  const canPlaySelected =
    selected?.isFree && Boolean(selected.fileUrl || selected.textBody);

  // No free video — compact curriculum list only
  if (!hasPlayableFree && outline && outline.subjects.length > 0) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Layers size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-slate-900">কোর্স কারিকুলাম</h2>
            <p className="text-xs text-slate-500">
              {totalSegmentCount}টি কন্টেন্ট
              {lockedCount > 0 ? ` · ${lockedCount}টি লকড` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToEnroll}
            className="hidden shrink-0 rounded-lg bg-[#5C2D91] px-3 py-1.5 text-xs font-bold text-white sm:inline-flex"
          >
            এনরোল
          </button>
        </div>
        <CompactCurriculumOnly
          outline={outline}
          freeSegmentCount={freeSegmentCount}
          totalSegmentCount={totalSegmentCount}
        />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Compact header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
            <MonitorPlay size={18} strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">কোর্স প্রিভিউ</h2>
            <p className="text-xs text-slate-500">
              {freeSegmentCount} ফ্রি · {lockedCount} লকড · মোট {totalSegmentCount || playlist.length}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={scrollToEnroll}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
        >
          <Lock className="h-3 w-3" />
          লকড কন্টেন্ট আনলক করুন
        </button>
      </div>

      <div className="grid lg:grid-cols-5">
        {/* Player — 3 cols */}
        <div className="border-b border-slate-100 p-4 lg:col-span-3 lg:border-b-0 lg:border-r">
          <div className="overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-900/10">
            {selected && canPlaySelected ? (
              <PreviewMedia item={selected} courseName={courseName} />
            ) : selected ? (
              <LockedPlayer title={selected.title} />
            ) : (
              <PlayerSkeleton />
            )}
          </div>
          {selected ? (
            <div className="mt-3 px-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {selected.isFree ? (
                  <span className="rounded bg-emerald-600 px-1.5 py-px text-[9px] font-black uppercase text-white">
                    ফ্রি
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-px text-[9px] font-bold uppercase text-slate-600">
                    <Lock className="h-2.5 w-2.5" />
                    লকড
                  </span>
                )}
                <span className="text-[10px] font-semibold text-slate-400">
                  {curriculumContentTypeLabel(selected.type)}
                </span>
                {formatDuration(selected.durationMinutes) ? (
                  <span className="text-[10px] text-slate-400">{formatDuration(selected.durationMinutes)}</span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">{selected.title}</p>
            </div>
          ) : null}
        </div>

        {/* Playlist — 2 cols, compact */}
        <div className="lg:col-span-2">
          <div className="max-h-[min(380px,50vh)] overflow-y-auto">
            {playlist.map((row, index) => {
              const active = row.id === selectedId;
              const thumb = row.isFree ? lessonThumbnail(row) : null;
              const prev = playlist[index - 1];
              const showChapter =
                index === 0 || prev.chapterTitle !== row.chapterTitle || prev.subjectTitle !== row.subjectTitle;

              return (
                <div key={row.id}>
                  {showChapter ? (
                    <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-3 py-1.5 backdrop-blur-sm">
                      <p className="truncate text-[10px] font-black uppercase tracking-wide text-slate-400">
                        {row.subjectTitle}
                      </p>
                      <p className="truncate text-[11px] font-bold text-slate-600">{row.chapterTitle}</p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      'relative flex w-full items-center gap-2.5 border-b border-slate-50 px-3 py-2 text-left transition-colors',
                      active ? 'bg-emerald-50/70' : 'hover:bg-slate-50',
                      !row.isFree && 'opacity-80',
                    )}
                  >
                    {active ? (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-emerald-500" />
                    ) : null}

                    <div
                      className={cn(
                        'relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800',
                        !row.isFree && 'grayscale',
                      )}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {row.isFree ? (
                            <Play className="h-3 w-3 text-slate-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-slate-500" />
                          )}
                        </div>
                      )}
                      {!row.isFree ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                          <Lock className="h-3 w-3 text-white/90" />
                        </div>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'line-clamp-2 text-[12px] font-bold leading-snug',
                          active ? 'text-emerald-950' : 'text-slate-800',
                        )}
                      >
                        {row.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {formatDuration(row.durationMinutes) ? (
                          <span className="text-[9px] text-slate-400">{formatDuration(row.durationMinutes)}</span>
                        ) : null}
                        {row.isFree ? (
                          <span className="text-[9px] font-bold text-emerald-600">ফ্রি</span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400">লকড</span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slim CTA */}
      <button
        type="button"
        onClick={scrollToEnroll}
        className="group flex w-full items-center justify-between gap-3 border-t border-slate-100 bg-linear-to-r from-[#5C2D91]/5 to-indigo-50/50 px-5 py-3 text-left transition hover:from-[#5C2D91]/10"
      >
        <p className="text-xs font-semibold text-slate-600 sm:text-sm">
          সব {lockedCount}টি লকড ক্লাস ও রিসোর্স আনলক করতে{' '}
          <span className="font-black text-[#5C2D91]">এনরোল করুন</span>
        </p>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#5C2D91] transition group-hover:translate-x-0.5" />
      </button>
    </section>
  );
}
