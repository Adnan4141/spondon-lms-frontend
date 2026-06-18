import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronRight, Users, Play } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { CourseDetails } from '@/types/course';
import type { ResumeLesson } from './course-hub-types';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

type Props = {
  course: CourseDetails;
  resume: ResumeLesson | null;
  teachersCount: number;
  resourcesCount: number;
  onTeachersClick?: () => void;
  onResourcesClick?: () => void;
};

export function CourseHubSidebar({
  course,
  resume,
  teachersCount,
  resourcesCount,
  onTeachersClick,
  onResourcesClick,
}: Props) {
  const teachers = (course.teachers ?? []).filter((t) => t.teacher).slice(0, 2);

  return (
    <aside className="hidden space-y-4 lg:block">
      {resume ? (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-purple-50/20 to-white p-5 shadow-sm">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
          
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
            <Play className="h-2 w-2 fill-current" />
            Up Next
          </span>
          
          <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-800 leading-snug">
            {resume.lessonTitle}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {resume.subjectTitle}
          </p>
          
          <Link
            href={resume.href}
            className="group/lnk mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Continue Lesson
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/lnk:translate-x-1" />
          </Link>
        </div>
      ) : null}

      {teachers.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users className="h-4.5 w-4.5 text-indigo-500" />
              Teachers
            </h3>
            {teachersCount > 2 && onTeachersClick ? (
              <button
                type="button"
                onClick={onTeachersClick}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View all
              </button>
            ) : null}
          </div>
          <ul className="mt-4 space-y-3.5">
            {teachers.map((t) => {
              const teacher = t.teacher!;
              const avatarUrl = teacher.profileImage
                ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)
                : null;
              return (
                <li key={t.id} className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-slate-200/60 object-cover shadow-sm transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-sm font-black text-indigo-600 border border-indigo-200/50 shadow-sm">
                      {teacher.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {teacher.fullName}
                    </p>
                    {teacher.designation ? (
                      <p className="truncate text-xs font-semibold text-slate-400 mt-0.5">{teacher.designation}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {resourcesCount > 0 && onResourcesClick ? (
        <button
          type="button"
          onClick={onResourcesClick}
          className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition-colors group-hover:bg-amber-100">
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            Resources
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              {resourcesCount}
            </span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </button>
      ) : null}
    </aside>
  );
}
