'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseYm(value: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7)) - 1; // 0-indexed
  if (month < 0 || month > 11) return null;
  return { year, month };
}

export interface MonthYearPickerProps {
  value: string; // YYYY-MM
  onChange: (yyyyMm: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Pick a month + year. Value/onChange use YYYY-MM format. No day selection needed. */
export function MonthYearPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className,
  disabled,
}: MonthYearPickerProps) {
  const parsed = parseYm(value);
  const currentYear = new Date().getFullYear();

  const [viewYear, setViewYear] = useState(() => parsed?.year ?? currentYear);
  const [open, setOpen] = useState(false);

  const display = parsed ? `${MONTHS_FULL[parsed.month]} ${parsed.year}` : null;

  function handleMonthClick(monthIndex: number) {
    const mm = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      // Re-sync viewYear to the current value when opening
      setViewYear(parsed?.year ?? currentYear);
    }
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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

      <PopoverContent
        className="w-72 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl"
        align="start"
      >
        {/* Year navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-3">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-black text-slate-900 tracking-wider">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {MONTHS.map((label, idx) => {
            const isSelected = parsed?.year === viewYear && parsed?.month === idx;
            const isCurrentMonth =
              new Date().getFullYear() === viewYear && new Date().getMonth() === idx;

            return (
              <button
                key={label}
                type="button"
                onClick={() => handleMonthClick(idx)}
                className={cn(
                  'rounded-xl py-2.5 text-sm font-bold transition-all',
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : isCurrentMonth
                    ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Billing cycle month · {value || '—'}
        </div>
      </PopoverContent>
    </Popover>
  );
}
