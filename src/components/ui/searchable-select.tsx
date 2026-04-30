'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results.',
  disabled,
  className,
  triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = options.find((o) => o.value === value);
  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-12 w-full justify-between rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-900 shadow-inner hover:bg-slate-50/80',
            !selected && 'text-slate-400',
            triggerClassName
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[var(--radix-popover-trigger-width)] overflow-hidden border-slate-200 bg-white p-0 text-slate-900 shadow-xl',
          className
        )}
        align="start"
        onWheelCapture={(event) => event.stopPropagation()}
        onTouchMoveCapture={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-100"
            />
          </div>
        </div>

        <div className="max-h-[min(18rem,var(--radix-popover-content-available-height,18rem))] overflow-y-auto overscroll-contain p-1 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-5 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
                  value === opt.value && 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 focus:bg-indigo-50'
                )}
                onClick={() => handleSelect(opt.value)}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value === opt.value ? 'text-indigo-600 opacity-100' : 'text-slate-900 opacity-0'
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
