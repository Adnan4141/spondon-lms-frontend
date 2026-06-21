'use client';

import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCurrentMonthLabel,
  getNextMonthLabel,
  isMonthPresetActive,
  type MonthPreset,
} from '../shared';

export function MonthPresetButtons({
  month,
  from,
  to,
  onSelect,
  className,
}: {
  month: string;
  from: string;
  to: string;
  onSelect: (preset: MonthPreset) => void;
  className?: string;
}) {
  const query = { month, from, to };
  const currentActive = isMonthPresetActive(query, 'current');
  const nextActive = isMonthPresetActive(query, 'next');

  const presets: { key: MonthPreset; label: string }[] = [
    { key: 'current', label: `This Month — ${getCurrentMonthLabel()}` },
    { key: 'next', label: `Next Month — ${getNextMonthLabel()}` },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.map((preset) => {
        const active = preset.key === 'current' ? currentActive : nextActive;
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onSelect(preset.key)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-colors',
              active
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            <CalendarRange className="h-4 w-4 shrink-0" />
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
