'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Search, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TeacherOption = {
  id: string;
  fullName: string;
  email?: string;
  mobile?: string;
  status?: string;
};

export function TeacherCombobox({
  teachers,
  value,
  onSelect,
  placeholder = 'Select teacher',
  allowClear = true,
  slotCounts = {},
}: {
  teachers: TeacherOption[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  slotCounts?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = teachers.find((t) => t.id === value);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      t.fullName.toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.mobile || '').toLowerCase().includes(q),
    );
  }, [teachers, search]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.fullName : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teacher..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {allowClear && (
            <button
              type="button"
              onClick={() => { onSelect(''); setOpen(false); }}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              None
            </button>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onSelect(t.id); setOpen(false); }}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left hover:bg-muted',
                'flex items-start gap-2',
                value === t.id && 'bg-primary/10',
              )}
            >
              <User2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{t.fullName}</p>
                  {(slotCounts[t.id] ?? 0) > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                      {slotCounts[t.id]}×
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {t.email || t.mobile || 'No contact'}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No teacher found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
