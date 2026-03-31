'use client';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookOutlineSubject } from '@/lib/api/books';

const TAB_THRESHOLD = 4;

interface BookSubjectSelectorProps {
  subjects: BookOutlineSubject[];
  activeSubjectId: string | null;
  onSubjectChange: (id: string) => void;
}

export function BookSubjectSelector({ subjects, activeSubjectId, onSubjectChange }: BookSubjectSelectorProps) {
  if (subjects.length === 0) return null;

  if (subjects.length <= TAB_THRESHOLD) {
    return (
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSubjectChange(s.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-bold transition-all',
              activeSubjectId === s.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {s.title}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">বিষয় নির্বাচন</label>
      <Select value={activeSubjectId || undefined} onValueChange={onSubjectChange}>
        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-semibold">
          <SelectValue placeholder="বিষয় বেছে নিন" />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
