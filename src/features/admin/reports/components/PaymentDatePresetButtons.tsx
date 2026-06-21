'use client';

import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCurrentMonthLabel,
  getLastMonthLabel,
  isPaymentDatePresetActive,
  type PaymentDatePreset,
} from '../shared';

export function PaymentDatePresetButtons({
  from,
  to,
  onSelect,
  className,
}: {
  from: string;
  to: string;
  onSelect: (preset: PaymentDatePreset) => void;
  className?: string;
}) {
  const query = { from, to };
  const presets: { key: PaymentDatePreset; label: string }[] = [
    { key: 'current', label: `This Month — ${getCurrentMonthLabel()}` },
    { key: 'last', label: `Last Month — ${getLastMonthLabel()}` },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.map((preset) => {
        const active = isPaymentDatePresetActive(query, preset.key);
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
