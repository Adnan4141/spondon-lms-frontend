'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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

  const selectedBranches = useMemo(() => {
    const map = new Map(branches.map((b) => [b.id, b]));
    return value.map((id) => map.get(id)).filter(Boolean) as Branch[];
  }, [branches, value]);

  const remaining = useMemo(
    () => branches.filter((b) => !value.includes(b.id)),
    [branches, value]
  );

  const add = (id: string) => {
    if (value.includes(id)) return;
    onChange([...value, id]);
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

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || remaining.length === 0}
            className="h-11 w-full justify-between rounded-lg border-slate-200 bg-white font-normal"
          >
            <span className="truncate text-slate-600">
              {remaining.length === 0 ? 'All branches added' : 'Search and add branch…'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
          <Command className="rounded-lg border-0">
            <CommandInput placeholder="Search branches…" />
            <CommandList>
              <CommandEmpty>No branch matches.</CommandEmpty>
              <CommandGroup>
                {remaining.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`${b.name} ${b.code ?? ''} ${b.id}`}
                    onSelect={() => add(b.id)}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    <span className="font-medium">{b.name}</span>
                    {b.code ? (
                      <span className="ml-2 text-xs text-slate-400">{b.code}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className={cn('text-xs text-slate-500')}>
        Only branch admins at these branches can run admissions and enrollments for this course (when access is limited).
      </p>
    </div>
  );
}
