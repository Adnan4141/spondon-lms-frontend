'use client';

import { useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Second line shown below the label in the dropdown */
  sublabel?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  disabled,
  clearable = true,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find(o => o.value === value);

  const filtered = search.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setSearch('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch('');
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm cursor-pointer transition-colors',
            'hover:border-slate-300 focus:outline-none',
            open && 'ring-2 ring-indigo-100 border-indigo-300',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          )}
        >
          <span className={cn('flex-1 text-left truncate', !selected ? 'text-slate-400' : 'text-slate-900')}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            {clearable && value && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 min-w-60"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        sideOffset={4}
      >
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="pl-8 h-8 text-sm border-slate-200 focus-visible:ring-indigo-100"
            />
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto [scrollbar-color:rgb(148_163_184)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/80 [&::-webkit-scrollbar-thumb:hover]:bg-slate-500">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-400 text-center">No results found</p>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors hover:bg-slate-50',
                  value === opt.value && 'bg-indigo-50',
                )}
              >
                <span className="flex-1 min-w-0">
                  <span className={cn(
                    'block font-medium truncate text-sm',
                    value === opt.value ? 'text-indigo-700' : 'text-slate-900',
                  )}>
                    {opt.label}
                  </span>
                  {opt.sublabel && (
                    <span className="block text-[11px] text-slate-400 truncate">{opt.sublabel}</span>
                  )}
                </span>
                {value === opt.value && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
