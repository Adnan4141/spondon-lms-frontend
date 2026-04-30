'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Branch } from '@/lib/api/branches';

type Props = {
  branches: Branch[];
  value: string[];
  onChange: (branchIds: string[]) => void;
  disabled?: boolean;
};

export function BranchMultiSelect({ branches, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedBranches = useMemo(() => {
    const map = new Map(branches.map((b) => [b.id, b]));
    return value.map((id) => map.get(id)).filter(Boolean) as Branch[];
  }, [branches, value]);

  const remaining = useMemo(
    () => branches.filter((b) => !value.includes(b.id)),
    [branches, value]
  );
  const filteredBranches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return remaining;

    return remaining.filter((branch) =>
      branch.name.toLowerCase().includes(q) ||
      (branch.code?.toLowerCase().includes(q) ?? false)
    );
  }, [query, remaining]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const add = (id: string) => {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setQuery('');
    setOpen(false);
  };

  const remove = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedBranches.length === 0 ? (
          <p className="text-sm text-slate-500">No branches selected yet.</p>
        ) : (
          selectedBranches.map((b) => (
            <Badge
              key={b.id}
              variant="secondary"
              className="gap-1 pr-1 text-sm font-medium"
            >
              {b.name}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 rounded-full p-0.5 hover:bg-slate-300/80"
                  onClick={() => remove(b.id)}
                  aria-label={`Remove ${b.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || remaining.length === 0}
            className="h-11 w-full justify-between rounded-lg border-slate-200 bg-white font-normal text-slate-900"
          >
            <span className="truncate text-slate-600">
              {remaining.length === 0 ? 'All branches added' : 'Search and add branch…'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden rounded-xl border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
          align="start"
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search branches..."
                className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-100"
              />
            </div>
          </div>
          <div className="max-h-[min(18rem,var(--radix-popover-content-available-height,18rem))] overflow-y-auto overscroll-contain p-1 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
            {filteredBranches.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm font-medium text-slate-500">No branch matches.</p>
            ) : (
              filteredBranches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                  onClick={() => add(b.id)}
                >
                  <Check className="h-4 w-4 shrink-0 text-slate-900 opacity-0" />
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  {b.code ? (
                    <span className="shrink-0 text-xs text-slate-400">{b.code}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <p className={cn('text-xs text-slate-500')}>
        Only branch admins at these branches can run admissions and enrollments for this course (when access is limited).
      </p>
    </div>
  );
}
