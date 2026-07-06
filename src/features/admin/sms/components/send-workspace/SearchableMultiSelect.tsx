'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Option } from './types';

export function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
  disabled,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOptions = useMemo(
    () =>
      selected
        .map((id) => options.find((option) => option.id === id))
        .filter((option): option is Option => Boolean(option)),
    [options, selected],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const toggleOption = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter((id) => id !== optionId));
      return;
    }
    onChange([...selected, optionId]);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {selected.length > 0 ? (
          <span className="text-[10px] font-medium text-slate-500">{selected.length} selected</span>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || options.length === 0}
            className={cn(
              'h-9 w-full justify-between rounded-md border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 shadow-xs hover:bg-white',
              !selectedOptions.length && 'text-slate-500',
            )}
          >
            <span className="truncate">
              {options.length === 0
                ? emptyMessage
                : selectedOptions.length
                  ? `${selectedOptions.length} selected`
                  : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden rounded-xl border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
          align="start"
          onWheelCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-md border-slate-200 bg-white pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-100"
              />
            </div>
          </div>

          <div className="max-h-[min(18rem,var(--radix-popover-content-available-height,18rem))] overflow-y-auto overscroll-contain p-1 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => {
                const checked = selected.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
                      checked && 'bg-indigo-50 hover:bg-indigo-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white',
                      )}
                      aria-hidden
                    >
                      {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{option.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800"
            >
              <span className="max-w-[220px] truncate">{option.name}</span>
              <button
                type="button"
                className="ml-0.5 rounded-sm opacity-70 transition hover:opacity-100"
                onClick={() => onChange(selected.filter((id) => id !== option.id))}
                aria-label={`Remove ${option.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
