'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AuditFiltersState, CategoryChip } from '../audit-utils';
import { filtersForCategoryChip } from '../audit-utils';

type AuditFiltersProps = {
  filters: AuditFiltersState;
  open: boolean;
  activeCount: number;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<AuditFiltersState>) => void;
  onClear: () => void;
};

const CATEGORY_CHIPS: { key: CategoryChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'course', label: 'Course' },
  { key: 'cms', label: 'CMS' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'sms', label: 'SMS' },
  { key: 'exam', label: 'Exam' },
  { key: 'payment', label: 'Payment' },
  { key: 'auth', label: 'Auth' },
];

const FILTER_FIELDS: {
  key: keyof AuditFiltersState;
  label: string;
  placeholder: string;
  type?: 'date';
}[] = [
  { key: 'actorUserId', label: 'Actor ID', placeholder: 'User ID' },
  { key: 'entityType', label: 'Entity type', placeholder: 'Course, AUTH…' },
  { key: 'entityId', label: 'Entity ID', placeholder: 'Record ID' },
  { key: 'action', label: 'Action', placeholder: 'COURSE_UPDATED…' },
  { key: 'search', label: 'Search', placeholder: 'Action or entity…' },
  { key: 'from', label: 'From', placeholder: '', type: 'date' },
  { key: 'to', label: 'To', placeholder: '', type: 'date' },
];

export function AuditFilters({
  filters,
  open,
  activeCount,
  onOpenChange,
  onChange,
  onClear,
}: AuditFiltersProps) {
  const [activeChip, setActiveChip] = useState<CategoryChip>('all');

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-3 py-2">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => {
              setActiveChip(chip.key);
              onChange(filtersForCategoryChip(chip.key));
            }}
            className={cn(
              'rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide transition-colors',
              activeChip === chip.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600">
          <Filter className="h-3.5 w-3.5" />
          Advanced filters
          {activeCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-black text-white">
              {activeCount}
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
            {FILTER_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {field.label}
                </Label>
                <Input
                  type={field.type ?? 'text'}
                  className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-indigo-300"
                  placeholder={field.placeholder}
                  value={filters[field.key]}
                  onChange={(e) => onChange({ [field.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full gap-1 rounded-lg text-xs font-bold"
                onClick={() => {
                  setActiveChip('all');
                  onClear();
                }}
                disabled={activeCount === 0}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
