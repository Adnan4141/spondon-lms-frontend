import { BookOpen, GraduationCap, Monitor, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  total: number;
  active: number;
  online: number;
  enrollments: number;
};

export function TeacherCoursesStats({ total, active, online, enrollments }: Props) {
  const items = [
    {
      label: 'Courses',
      value: total,
      icon: BookOpen,
      iconClass: 'bg-indigo-500/15 text-indigo-600',
    },
    {
      label: 'Active',
      value: active,
      icon: GraduationCap,
      iconClass: 'bg-emerald-500/15 text-emerald-600',
    },
    {
      label: 'Online',
      value: online,
      icon: Monitor,
      iconClass: 'bg-violet-500/15 text-violet-600',
    },
    {
      label: 'Students',
      value: enrollments,
      icon: Users,
      iconClass: 'bg-amber-500/15 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon, iconClass }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                iconClass,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="text-xl font-black leading-none text-slate-900">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
