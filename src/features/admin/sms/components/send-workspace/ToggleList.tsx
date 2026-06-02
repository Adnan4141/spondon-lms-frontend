'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Option } from './types';

export function ToggleList({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
        <Badge variant="outline" className="text-[10px]">{selected.length} selected</Badge>
      </div>
      <div className="max-h-52 space-y-1 overflow-auto p-2">
        {options.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">No options found.</p>
        ) : options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50">
            <Checkbox checked={selected.includes(option.id)} onCheckedChange={() => onToggle(option.id)} />
            <span className="font-medium text-slate-700">{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
