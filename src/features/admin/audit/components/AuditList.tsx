import { ClipboardList, RefreshCw } from 'lucide-react';
import type { ActorRoleGroup } from '@/lib/api/audit';
import type { AuditRow } from '@/lib/api/audit';
import { AuditEntryCard } from './AuditEntryCard';

const EMPTY_MESSAGES: Record<ActorRoleGroup, string> = {
  admin: 'No Super Admin or Branch Admin actions in this period.',
  portal: 'No Student or Teacher actions in this period.',
  all: 'No audit records found for the selected filters.',
};

export function AuditList({
  rows,
  loading,
  actorRoleGroup,
}: {
  rows: AuditRow[];
  loading: boolean;
  actorRoleGroup: ActorRoleGroup;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Activity log
        </span>
        <span className="text-[10px] font-semibold text-slate-400">
          — tap a row for before / after details
        </span>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-3 py-12 text-sm font-semibold text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading audit logs…
        </div>
      ) : rows.length === 0 ? (
        <div className="px-3 py-12 text-center">
          <p className="text-sm font-black text-slate-500">No records found</p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {EMPTY_MESSAGES[actorRoleGroup]}
          </p>
        </div>
      ) : (
        <div>
          {rows.map((row) => (
            <AuditEntryCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
