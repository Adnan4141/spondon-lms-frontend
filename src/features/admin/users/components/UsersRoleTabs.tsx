import { cn } from '@/lib/utils';
import { ROLE_CARD_STYLES, USER_ROLE_TABS } from '../users-constants';
import { countByRole } from '../users-page-utils';

type UsersRoleTabsProps = {
  roleTab: string;
  summaryLoading: boolean;
  roleSummary: { byRole: Record<string, number>; total: number };
  onRoleTabChange: (role: string) => void;
};

export function UsersRoleTabs({
  roleTab,
  summaryLoading,
  roleSummary,
  onRoleTabChange,
}: UsersRoleTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {USER_ROLE_TABS.map((tab) => {
        const meta = ROLE_CARD_STYLES[tab.key] ?? ROLE_CARD_STYLES.ALL;
        const Icon = meta.icon;
        const active = roleTab === tab.key;
        const count =
          tab.key === 'ALL' ? roleSummary.total : countByRole(roleSummary, tab.key);

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onRoleTabChange(tab.key)}
            className={cn(
              'group rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
              active
                ? cn(meta.active, 'shadow-lg')
                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={cn('text-2xl font-black tabular-nums', active ? 'text-white' : 'text-slate-950')}>
                  {summaryLoading ? '…' : count}
                </p>
                <p
                  className={cn(
                    'mt-1 text-[10px] font-black uppercase tracking-wider',
                    active ? 'text-white/80' : 'text-slate-400',
                  )}
                >
                  {tab.label}
                </p>
              </div>
              <div
                className={cn(
                  'rounded-lg border p-2 transition-colors',
                  active
                    ? 'border-white/20 bg-white/15'
                    : 'border-slate-100 bg-slate-50 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-700',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
