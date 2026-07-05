import { BookOpen, Clock, FileText, Layers, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from './teacher-course-utils';

type Props = {
  subjectCount: number;
  chapterCount: number;
  segmentCount: number;
  videoCount: number;
  docCount: number;
  totalDurationMinutes: number;
};

export function TeacherCourseStats({
  subjectCount,
  chapterCount,
  segmentCount,
  videoCount,
  docCount,
  totalDurationMinutes,
}: Props) {
  const items = [
    {
      label: 'Subjects',
      val: subjectCount,
      icon: <BookOpen className="h-4 w-4" />,
      tc: 'text-violet-700',
      gradient: 'bg-gradient-to-br from-violet-50 to-fuchsia-50/60',
      border: 'border-violet-200/60',
    },
    {
      label: 'Chapters',
      val: chapterCount,
      icon: <Layers className="h-4 w-4" />,
      tc: 'text-blue-700',
      gradient: 'bg-gradient-to-br from-blue-50 to-sky-50/60',
      border: 'border-blue-200/60',
    },
    {
      label: 'Segments',
      val: segmentCount,
      icon: <FileText className="h-4 w-4" />,
      tc: 'text-indigo-700',
      gradient: 'bg-gradient-to-br from-indigo-50 to-blue-50/60',
      border: 'border-indigo-200/60',
    },
    {
      label: 'Videos',
      val: videoCount,
      icon: <PlayCircle className="h-4 w-4" />,
      tc: 'text-emerald-700',
      gradient: 'bg-gradient-to-br from-emerald-50 to-teal-50/60',
      border: 'border-emerald-200/60',
    },
    ...(totalDurationMinutes > 0
      ? [
          {
            label: 'Duration',
            val: formatDuration(totalDurationMinutes),
            icon: <Clock className="h-4 w-4" />,
            tc: 'text-rose-700',
            gradient: 'bg-gradient-to-br from-rose-50 to-orange-50/60',
            border: 'border-rose-200/60',
          },
        ]
      : docCount > 0
        ? [
            {
              label: 'Documents',
              val: docCount,
              icon: <FileText className="h-4 w-4" />,
              tc: 'text-amber-700',
              gradient: 'bg-gradient-to-br from-amber-50 to-orange-50/60',
              border: 'border-amber-200/60',
            },
          ]
        : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((c) => (
        <div
          key={c.label}
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
            c.gradient,
            c.border,
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm',
              c.tc,
            )}
          >
            {c.icon}
          </div>
          <div className="min-w-0">
            <p className={cn('text-lg font-black leading-none tracking-tight', c.tc)}>{c.val}</p>
            <p className={cn('mt-1 text-[10px] font-bold uppercase tracking-wide opacity-70', c.tc)}>
              {c.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
