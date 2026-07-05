import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/types/course';
import { cn } from '@/lib/utils';
import { thumbnailSrc } from './teacher-courses-list-utils';

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-50/95 text-emerald-800 border-emerald-200',
  DISABLED: 'bg-amber-50/95 text-amber-800 border-amber-200',
  ARCHIVED: 'bg-slate-100/95 text-slate-600 border-slate-200',
};

type Props = {
  course: Course;
};

export function TeacherCourseListCard({ course }: Props) {
  const src = thumbnailSrc(course);

  return (
    <Link
      href={`/teacher/courses/${course.id}`}
      className="group flex max-h-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="relative h-[140px] max-h-[150px] shrink-0 overflow-hidden bg-slate-100 sm:h-[150px]">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <GraduationCap className="h-12 w-12 opacity-60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              'rounded-lg border text-[9px] font-black uppercase tracking-wider backdrop-blur-sm',
              statusStyle[course.status] || 'bg-white/90 text-slate-600',
            )}
          >
            {course.status}
          </Badge>
          <Badge className="rounded-lg border-0 bg-white/90 text-[9px] font-black uppercase text-slate-700 shadow-sm backdrop-blur-sm">
            {course.type}
          </Badge>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <p className="truncate font-mono text-[10px] font-bold text-slate-400">{course.slug}</p>
        <h2 className="mt-0.5 line-clamp-2 text-base font-black leading-snug text-slate-900 transition-colors group-hover:text-indigo-600">
          {course.name}
        </h2>
        {course.program?.name ? (
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            {course.program.name}
          </p>
        ) : (
          <div className="mt-1.5 h-4" />
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {course._count?.enrollments ?? 0} enrolled
          </span>
          <span className="flex items-center gap-1 text-xs font-black text-indigo-600 transition-all group-hover:gap-2">
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
