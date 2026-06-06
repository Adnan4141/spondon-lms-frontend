import { cn } from '@/lib/utils';
import { formatJson } from '../audit-utils';

export function AuditJsonPanel({
  label,
  value,
  variant,
}: {
  label: string;
  value: unknown;
  variant: 'before' | 'after';
}) {
  const isBefore = variant === 'before';

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div
        className={cn(
          'border-b px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest',
          isBefore ? 'border-slate-100 text-slate-500' : 'border-slate-100 text-slate-700',
        )}
      >
        {label}
      </div>
      <pre className="max-h-48 overflow-auto p-2.5 font-mono text-[11px] leading-relaxed text-slate-700">
        {formatJson(value)}
      </pre>
    </div>
  );
}
