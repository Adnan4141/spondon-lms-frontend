import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronRight, Users } from 'lucide-react';
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
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
            Up next
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
            {resume.lessonTitle}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{resume.subjectTitle}</p>
          <Link
            href={resume.href}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      {teachers.length > 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Users className="h-4 w-4 text-indigo-500" />
              Teachers
            </h3>
            {teachersCount > 2 && onTeachersClick ? (
              <button
                type="button"
                onClick={onTeachersClick}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View all
              </button>
            ) : null}
          </div>
          <ul className="mt-3 space-y-3">
            {teachers.map((t) => {
              const teacher = t.teacher!;
              const avatarUrl = teacher.profileImage
                ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)
                : null;
              return (
                <li key={t.id} className="flex items-center gap-2.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {teacher.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {teacher.fullName}
                    </p>
                    {teacher.designation ? (
                      <p className="truncate text-xs text-slate-500">{teacher.designation}</p>
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
          className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-colors hover:border-slate-300"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <BookOpen className="h-4 w-4 text-amber-500" />
            Resources
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            {resourcesCount}
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      ) : null}
    </aside>
  );
}
