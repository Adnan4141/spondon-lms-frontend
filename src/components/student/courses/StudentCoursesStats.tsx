import { Award, BookOpen, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  total: number;
  inProgress: number;
  completed: number;
};

export function StudentCoursesStats({ total, inProgress, completed }: Props) {
  const items = [
    {
      label: 'Enrolled',
      value: total,
      icon: BookOpen,
      bgClass: 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-500/5',
      iconBg: 'bg-indigo-100/80 text-indigo-600',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Compass,
      bgClass: 'bg-amber-50/50 border-amber-100 hover:border-amber-300 hover:shadow-amber-500/5',
      iconBg: 'bg-amber-100/80 text-amber-600',
    },
    {
      label: 'Completed',
      value: completed,
      icon: Award,
      bgClass: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/5',
      iconBg: 'bg-emerald-100/80 text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              'relative overflow-hidden rounded-2xl border bg-white p-4 transition-all duration-300 shadow-sm flex items-center gap-3.5 sm:gap-4',
              item.bgClass
            )}
          >
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300', item.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="min-w-0">
              <p className="text-2xl font-black leading-none tracking-tight tabular-nums text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
