'use client';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TAB_THRESHOLD = 4;

interface SubjectTabsOrSelectProps {
  subjects: string[];
  activeSubject: string;
  onSubjectChange: (subject: string) => void;
}

export function SubjectTabsOrSelect({ subjects, activeSubject, onSubjectChange }: SubjectTabsOrSelectProps) {
  if (subjects.length <= 1) return null;

  if (subjects.length <= TAB_THRESHOLD) {
    return (
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3 mb-3">
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSubjectChange(s)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-black transition-colors',
              activeSubject === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {s === 'Course' ? 'কোর্স' : s}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">বিষয়</label>
      <Select value={activeSubject} onValueChange={onSubjectChange}>
        <SelectTrigger className="h-10 rounded-xl border-slate-100 text-sm font-bold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'Course' ? 'কোর্স' : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
