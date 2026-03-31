'use client';

import { Play, FileText, HelpCircle, FileQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BookOutlineSegment } from '@/lib/api/books';

function formatDuration(min: number | null) {
  if (min == null || min <= 0) return '—';
  if (min >= 60) return `${Math.floor(min / 60)}ঘ ${min % 60}মি`;
  return `${min} মি`;
}

function segmentIcon(type: string) {
  if (type === 'VIDEO') return <Play className="h-4 w-4 text-indigo-500" />;
  if (type === 'PDF' || type === 'NOTE') return <FileText className="h-4 w-4 text-slate-500" />;
  if (type === 'OTHER' && type.includes('QUIZ')) return <HelpCircle className="h-4 w-4 text-amber-500" />;
  return <FileQuestion className="h-4 w-4 text-slate-400" />;
}

function typeLabel(type: string) {
  if (type === 'VIDEO') return 'ভিডিও';
  if (type === 'NOTE' || type === 'PDF') return 'নোট';
  if (type === 'SYLLABUS' || type === 'LEAFLET' || type === 'SAMPLE') return 'রিসোর্স';
  return type;
}

interface BookSegmentItemProps {
  segment: BookOutlineSegment;
}

export function BookSegmentItem({ segment }: BookSegmentItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
      <div className="mt-0.5 shrink-0">{segmentIcon(segment.type)}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{segment.title}</p>
        {segment.topicTitle && segment.topicTitle !== segment.title ? (
          <p className="text-xs text-slate-500 mt-0.5">{segment.topicTitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide">
          {typeLabel(segment.type)}
        </Badge>
        <span className="text-[11px] font-medium text-slate-400">{formatDuration(segment.durationMinutes)}</span>
        {segment.isFree ? (
          <span className="text-[10px] font-bold text-emerald-600">ফ্রি</span>
        ) : null}
      </div>
    </div>
  );
}
