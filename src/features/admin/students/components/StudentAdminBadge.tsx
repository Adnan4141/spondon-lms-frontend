'use client';

import { cn } from '@/lib/utils';

export type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'orange' | 'purple';

export function StudentAdminBadge({ label, color = 'slate' }: { label: string; color?: BadgeColor }) {
  const styles: Record<BadgeColor, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-indigo-50 text-indigo-700',
    slate: 'bg-slate-100 text-slate-600',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap', styles[color])}>
      {label}
    </span>
  );
}
