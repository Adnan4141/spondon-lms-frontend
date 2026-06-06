'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getBranches } from '@/lib/api/branches';
import { cn } from '@/lib/utils';
import type { AuditFiltersState, CategoryChip } from '../audit-utils';
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  AUDIT_ROLE_OPTIONS,
  filtersForCategoryChip,
} from '../audit-utils';
import { AuditExpandablePanel } from './AuditExpandablePanel';
import { AuditUserPicker } from './AuditUserPicker';

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

const COMPACT_TRIGGER = 'h-8 rounded-lg border-slate-200 bg-slate-50 px-2 text-xs font-semibold shadow-none hover:bg-slate-100';

export function AuditFilters({
  filters,
  open,
  activeCount,
  onOpenChange,
  onChange,
  onClear,
}: AuditFiltersProps) {
  const [activeChip, setActiveChip] = useState<CategoryChip>('all');
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'All branches' },
  ]);

  useEffect(() => {
    getBranches({ all: true })
      .then((res) => {
        if (!res.success || !res.data) return;
        setBranchOptions([
          { value: '', label: 'All branches' },
          ...res.data.map((branch) => ({ value: branch.id, label: branch.name })),
        ]);
      })
      .catch(() => undefined);
  }, []);

  const branchSelectOptions = useMemo(() => branchOptions, [branchOptions]);

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

      <AuditExpandablePanel expanded={open}>
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">User (actor)</Label>
              <AuditUserPicker
                value={filters.actorUserId}
                actorRole={filters.actorRole || undefined}
                onChange={(userId) => onChange({ actorUserId: userId })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Role</Label>
              <SearchableSelect
                options={AUDIT_ROLE_OPTIONS}
                value={filters.actorRole}
                onValueChange={(value) => onChange({ actorRole: value })}
                placeholder="All roles"
                searchPlaceholder="Search role…"
                triggerClassName={COMPACT_TRIGGER}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Branch</Label>
              <SearchableSelect
                options={branchSelectOptions}
                value={filters.branchId}
                onValueChange={(value) => onChange({ branchId: value })}
                placeholder="All branches"
                searchPlaceholder="Search branch…"
                triggerClassName={COMPACT_TRIGGER}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Action</Label>
              <SearchableSelect
                options={AUDIT_ACTION_OPTIONS}
                value={filters.action}
                onValueChange={(value) => onChange({ action: value })}
                placeholder="All actions"
                searchPlaceholder="Search action…"
                triggerClassName={COMPACT_TRIGGER}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Entity type</Label>
              <SearchableSelect
                options={AUDIT_ENTITY_OPTIONS}
                value={filters.entityType}
                onValueChange={(value) => onChange({ entityType: value })}
                placeholder="All entity types"
                searchPlaceholder="Search entity…"
                triggerClassName={COMPACT_TRIGGER}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Entity ID</Label>
              <Input
                className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-indigo-300"
                placeholder="Record ID"
                value={filters.entityId}
                onChange={(e) => onChange({ entityId: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Search</Label>
              <Input
                className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-indigo-300"
                placeholder="Action or entity…"
                value={filters.search}
                onChange={(e) => onChange({ search: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">From</Label>
              <Input
                type="date"
                className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-indigo-300"
                value={filters.from}
                onChange={(e) => onChange({ from: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">To</Label>
              <Input
                type="date"
                className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-indigo-300"
                value={filters.to}
                onChange={(e) => onChange({ to: e.target.value })}
              />
            </div>

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
      </AuditExpandablePanel>
    </section>
  );
}
