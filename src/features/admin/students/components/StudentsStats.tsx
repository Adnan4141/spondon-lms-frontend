'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type StudentsDatabaseStats = {
  total: number;
  active: number;
  blocked: number;
  newThisMonth: number;
};

type StudentsStatsProps = {
  stats: StudentsDatabaseStats | null;
  loading?: boolean;
};

function StudentsStatsInner({ stats, loading }: StudentsStatsProps) {
  const display = stats ?? { total: 0, active: 0, blocked: 0, newThisMonth: 0 };
  const show = (n: number) => (loading ? '…' : n);

  const cards = [
    { label: 'Verified Students', value: show(display.total), icon: '👥', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active', value: show(display.active), icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Blocked', value: show(display.blocked), icon: '🚫', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'New This Month', value: show(display.newThisMonth), icon: '🆕', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 flex items-center gap-3.5 shadow-sm">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0', card.bg)}>{card.icon}</div>
          <div>
            <p className={cn('text-2xl font-black leading-none', card.color)}>{card.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export const StudentsStats = memo(StudentsStatsInner);
