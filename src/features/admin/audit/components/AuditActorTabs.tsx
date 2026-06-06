import { cn } from '@/lib/utils';
import type { ActorRoleGroup } from '@/lib/api/audit';

const TABS: { key: ActorRoleGroup; label: string; hint: string }[] = [
  { key: 'admin', label: 'Admin & Branch Admin', hint: 'Super Admin / Branch Admin actions' },
  { key: 'portal', label: 'Students & Teachers', hint: 'Student / Teacher portal actions' },
];

export function AuditActorTabs({
  value,
  onChange,
}: {
  value: ActorRoleGroup;
  onChange: (group: ActorRoleGroup) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-left transition-all',
              active
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
            )}
          >
            <span className="block text-xs font-black">{tab.label}</span>
            <span className={cn('block text-[10px] font-medium', active ? 'text-slate-300' : 'text-slate-400')}>
              {tab.hint}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'ml-auto rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
          value === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600',
        )}
      >
        All roles
      </button>
    </div>
  );
}
