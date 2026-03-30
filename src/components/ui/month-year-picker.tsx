'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function parseYm(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}$/.test(value)) return undefined;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7)) - 1;
  const d = new Date(y, m, 1);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toYm(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export interface MonthYearPickerProps {
  value: string;
  onChange: (yyyyMm: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Pick first day of month; value / onChange use `YYYY-MM`. */
export function MonthYearPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className,
  disabled,
}: MonthYearPickerProps) {
  const selected = parseYm(value);
  const display = selected ? format(selected, 'MMMM yyyy') : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-12 w-full justify-start rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-800 shadow-inner',
            !display && 'text-slate-400',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          {display || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toYm(date));
          }}
          className="rounded-2xl p-2"
        />
        <p className="border-t border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Billing cycle month · {value || '—'}
        </p>
      </PopoverContent>
    </Popover>
  );
}
