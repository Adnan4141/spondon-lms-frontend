'use client';

import { useState } from 'react';
import { Clock, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TYPE_CONFIG } from '@/features/admin/courses/courseConstants';
import type { ContentType } from '@/types/course-content';
import type { CourseContent } from '@/types/course-content';
import { cn } from '@/lib/utils';
import { resolveFileUrl } from './teacher-course-utils';

type Props = {
  item: CourseContent;
  index: number;
  canEdit: boolean;
  onEdit: (item: CourseContent) => void;
  onDelete: (item: CourseContent) => void;
};

export function TeacherSegmentRow({ item, index, canEdit, onEdit, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);
  const cfg = TYPE_CONFIG[item.type as ContentType] ?? TYPE_CONFIG.OTHER;
  const TypeIcon = cfg.icon;

  return (
    <div
      className="group flex flex-col gap-3 border-b border-slate-50 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50/60 sm:flex-row sm:items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="w-5 shrink-0 text-center text-[10px] font-black text-slate-300">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
          <TypeIcon className={cn('h-4 w-4', cfg.textColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[9px] font-black uppercase">
              {item.type}
            </Badge>
            {item.isFree ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-[9px] font-black uppercase text-emerald-600">
                Free
              </Badge>
            ) : null}
            {item.durationMinutes != null && item.durationMinutes > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Clock className="h-2.5 w-2.5" />
                {item.durationMinutes} min
              </span>
            ) : null}
            {!item.fileUrl && !item.textBody ? (
              <span className="text-[10px] font-bold text-amber-600">No file attached</span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center gap-1.5 pl-8 sm:pl-0',
          hovered ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
        )}
      >
        {item.fileUrl ? (
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild>
            <a
              href={resolveFileUrl(item.fileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open resource"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </a>
          </Button>
        ) : null}
        {canEdit ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => onEdit(item)}
              aria-label="Edit segment"
            >
              <Pencil className="h-3.5 w-3.5 text-amber-600" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-rose-50"
              onClick={() => onDelete(item)}
              aria-label="Delete segment"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
