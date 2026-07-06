'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Layers, Lock, Play } from 'lucide-react';
import type { CourseContentOutline } from '@/lib/api/courses';
import { curriculumContentTypeLabel } from '@/types/course';

type Props = {
  outline: CourseContentOutline;
  freeSegmentCount: number;
  totalSegmentCount: number;
  title?: string;
};

function formatDuration(min: number | null) {
  if (min == null || min <= 0) return null;
  if (min >= 60) return `${Math.floor(min / 60)}ঘ ${min % 60}মি`;
  return `${min} মি`;
}

export function CourseCurriculumOutline({
  outline,
  freeSegmentCount,
  totalSegmentCount,
  title = 'কোর্স কারিকুলাম',
}: Props) {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  if (outline.subjects.length === 0) return null;

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="space-y-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">সিলেবাস ও কন্টেন্ট</span>
            <h2 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
            {totalSegmentCount} সেগমেন্ট
          </span>
          {freeSegmentCount > 0 ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              {freeSegmentCount} ফ্রি প্রিভিউ
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {outline.subjects.map((sub, subIdx) => {
          const subOpen = expandedSubjects[sub.id] ?? subIdx === 0;
          const segTotal = sub.chapters.reduce((n, ch) => n + ch.segments.length, 0);

          return (
            <div key={sub.id} className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleSubject(sub.id)}
                className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-slate-50/80"
              >
                {subOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-indigo-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    বিষয় {subIdx + 1} · {sub.chapters.length} অধ্যায়
                  </p>
                  <p className="truncate text-base font-black text-slate-900">{sub.title}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{segTotal} সেগমেন্ট</p>
                </div>
              </button>

              {subOpen ? (
                <div className="space-y-3 border-t border-slate-50 bg-slate-50/40 p-3">
                  {sub.chapters.map((ch, chIdx) => {
                    const chapterKey = `${sub.id}::${ch.id}`;
                    const chOpen = expandedChapters[chapterKey] ?? false;
                    const videoCount = ch.segments.filter((s) => s.type === 'VIDEO').length;
                    const totalDuration = ch.segments.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

                    return (
                      <div key={chapterKey} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapterKey)}
                          className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/80"
                        >
                          {chOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-800" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">{ch.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span>{ch.segments.length} সেগমেন্ট</span>
                              {videoCount > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <Play className="h-2.5 w-2.5" /> {videoCount} ভিডিও
                                </span>
                              ) : null}
                              {totalDuration > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" /> {formatDuration(totalDuration)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">
                            Ch {chIdx + 1}
                          </span>
                        </button>

                        {chOpen ? (
                          <div className="border-t border-slate-50">
                            {ch.segments.map((seg, idx) => (
                              <div
                                key={seg.id}
                                className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-b-0"
                              >
                                <span className="w-5 shrink-0 text-center text-[10px] font-black text-slate-300">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-bold text-slate-700">{seg.title}</p>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                                      {curriculumContentTypeLabel(seg.type)}
                                    </span>
                                    {seg.durationMinutes != null && seg.durationMinutes > 0 ? (
                                      <span className="text-[10px] font-semibold text-slate-400">
                                        {formatDuration(seg.durationMinutes)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                {seg.isFree ? (
                                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                    ফ্রি
                                  </span>
                                ) : (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                    <Lock className="h-2.5 w-2.5" />
                                    প্রিমিয়াম
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
