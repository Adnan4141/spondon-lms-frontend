'use client';

import { useMemo, useState } from 'react';
import { ChevronsUpDown, GraduationCap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Institute } from '@/types/student';

export function InstituteCombobox({
  institutes,
  value,
  onSelect,
  placeholder = 'Select institute',
  allowClear = true,
}: {
  institutes: Institute[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = institutes.find((i) => i.id === value);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return institutes;
    return institutes.filter((i) =>
      i.name.toLowerCase().includes(q)
      || (i.eiin || '').toLowerCase().includes(q)
      || (i.district || '').toLowerCase().includes(q),
    );
  }, [institutes, search]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search institute..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {allowClear && (
            <button
              type="button"
              onClick={() => { onSelect(''); setOpen(false); }}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              None
            </button>
          )}
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => { onSelect(i.id); setOpen(false); }}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left hover:bg-muted',
                'flex items-start gap-2',
                value === i.id && 'bg-primary/10',
              )}
            >
              <GraduationCap className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{i.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {i.eiin ? `EIIN: ${i.eiin}` : i.district || i.type}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No institute found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}