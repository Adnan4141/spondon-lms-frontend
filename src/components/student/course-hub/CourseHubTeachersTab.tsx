import { Users } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { CourseDetails } from '@/types/course';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

type Props = {
  course: CourseDetails;
};

export function CourseHubTeachersTab({ course }: Props) {
  const teachers = (course.teachers ?? []).filter((t) => t.teacher);

  if (teachers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center text-sm text-slate-500">
        Teacher information is not available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Users className="h-4 w-4 text-indigo-500" />
        Your teachers
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {teachers.map((t) => {
          const teacher = t.teacher!;
          const avatarUrl = teacher.profileImage
            ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)
            : null;
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={teacher.fullName}
                  className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <span className="text-lg font-bold text-indigo-600">
                    {teacher.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{teacher.fullName}</p>
                {teacher.designation ? (
                  <p className="text-xs font-medium text-indigo-600 truncate">
                    {teacher.designation}
                  </p>
                ) : null}
                {teacher.institute ? (
                  <p className="text-xs text-slate-500 truncate">{teacher.institute}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
