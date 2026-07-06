'use client';

import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCurrentMonthLabel,
  getLastMonthLabel,
  isPaymentDatePresetActive,
  type PaymentDatePreset,
} from '../shared';

export function FinanceDatePresetButtons({
  from,
  to,
  onSelect,
  className,
  compact = false,
}: {
  from: string;
  to: string;
  onSelect: (preset: PaymentDatePreset) => void;
  className?: string;
  compact?: boolean;
}) {
  const query = { from, to };
  const presets: { key: PaymentDatePreset; label: string; shortLabel: string }[] = [
    { key: 'current', label: `This Month — ${getCurrentMonthLabel()}`, shortLabel: 'This Month' },
    { key: 'last', label: `Last Month — ${getLastMonthLabel()}`, shortLabel: 'Last Month' },
  ];

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {presets.map((preset) => {
        const active = isPaymentDatePresetActive(query, preset.key);
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onSelect(preset.key)}
            title={preset.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border font-bold transition-colors',
              compact ? 'h-8 px-2.5 text-[11px]' : 'h-9 rounded-full px-4 text-xs',
              active
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            <CalendarRange className={cn('shrink-0', compact ? 'h-3 w-3' : 'h-4 w-4')} />
            {compact ? preset.shortLabel : preset.label}
          </button>
        );
      })}
    </div>
  );
}
