'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-12 w-full justify-between rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-black shadow-inner hover:bg-slate-50/80',
            !selected && 'text-black/45',
            triggerClassName
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[var(--radix-popover-trigger-width)] border-slate-200 bg-white p-0 text-black shadow-xl',
          className
        )}
        align="start"
      >
        <Command className="rounded-lg border-0 bg-white text-black shadow-none [&_[cmdk-input-wrapper]]:border-slate-200">
          <CommandInput
            placeholder={searchPlaceholder}
            className="text-base font-medium text-black placeholder:text-black/45"
          />
          <CommandList>
            <CommandEmpty className="text-sm font-medium text-black">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  className="cursor-pointer text-base font-medium text-black aria-selected:bg-neutral-100 aria-selected:text-black data-highlighted:bg-neutral-100 data-highlighted:text-black"
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 shrink-0 text-black', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
