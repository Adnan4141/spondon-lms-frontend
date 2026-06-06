import { cn } from '@/lib/utils';
import type { AuditActorRole } from '@/lib/api/audit';

const ROLE_CHIPS: { key: AuditActorRole; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'SUPER_ADMIN', label: 'Super Admin' },
  { key: 'BRANCH_ADMIN', label: 'Branch Admin' },
  { key: 'STUDENT', label: 'Student' },
  { key: 'TEACHER', label: 'Teacher' },
];

export function AuditActorTabs({
  value,
  onChange,
}: {
  value: AuditActorRole;
  onChange: (role: AuditActorRole) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</span>
      {ROLE_CHIPS.map((chip) => {
        const active = value === chip.key;
        return (
          <button
            key={chip.key || 'all'}
            type="button"
            onClick={() => onChange(chip.key)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide transition-all',
              active
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
