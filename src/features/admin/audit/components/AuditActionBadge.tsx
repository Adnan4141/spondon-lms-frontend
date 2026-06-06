import { cn } from '@/lib/utils';
import { actionLabel, getAuditTheme } from '../audit-utils';

export function AuditActionBadge({
  action,
  entityType,
}: {
  action: string;
  entityType?: string;
}) {
  const theme = getAuditTheme(action, entityType);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
        theme.badge,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', theme.dot)} />
      {actionLabel(action)}
    </span>
  );
}
