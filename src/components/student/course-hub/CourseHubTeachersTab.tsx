import { Users, GraduationCap } from 'lucide-react';
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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-12 text-center">
        <Users className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">No teacher profiles available yet</p>
        <p className="mt-1 text-xs text-slate-400">Profiles will be updated once assigned by the administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
          <Users className="h-4 w-4" />
        </span>
        Your Instructors
      </h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {teachers.map((t) => {
          const teacher = t.teacher!;
          const avatarUrl = teacher.profileImage
            ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)
            : null;
          return (
            <div
              key={t.id}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5"
            >
              <div className="relative overflow-hidden rounded-full shrink-0 border-2 border-slate-100 shadow-sm transition-all duration-300 group-hover:border-indigo-100">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={teacher.fullName}
                    className="h-14 w-14 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-50">
                    <span className="text-xl font-black text-indigo-600 uppercase">
                      {teacher.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors leading-snug truncate">
                  {teacher.fullName}
                </p>
                {teacher.designation ? (
                  <p className="text-xs font-bold text-indigo-600 mt-1 truncate uppercase tracking-wider">
                    {teacher.designation}
                  </p>
                ) : null}
                {teacher.institute ? (
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    {teacher.institute}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
