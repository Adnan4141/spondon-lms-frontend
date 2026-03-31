'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { BookSegmentItem } from './BookSegmentItem';
import type { BookOutlineChapter } from '@/lib/api/books';

interface BookChapterAccordionProps {
  chapters: BookOutlineChapter[];
  expanded: Set<string>;
  onToggle: (chapterId: string) => void;
}

export function BookChapterAccordion({ chapters, expanded, onToggle }: BookChapterAccordionProps) {
  return (
    <div className="space-y-2">
      {chapters.map((ch) => {
        const isOpen = expanded.has(ch.id);
        const dur = ch.segments.reduce((s, seg) => s + (seg.durationMinutes ?? 0), 0);
        return (
          <div key={ch.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => onToggle(ch.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 min-w-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <span className="font-bold text-slate-900 truncate">{ch.title}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-slate-400">
                {ch.segments.length} টি · {dur > 0 ? `${dur} মি` : ''}
              </span>
            </button>
            {isOpen ? (
              <div className="space-y-2 border-t border-slate-100 bg-slate-50/30 p-3">
                {ch.segments.map((seg) => (
                  <BookSegmentItem key={seg.id} segment={seg} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
