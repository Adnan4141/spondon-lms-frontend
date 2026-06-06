'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Monitor } from 'lucide-react';
import type { AuditRow } from '@/lib/api/audit';
import { cn } from '@/lib/utils';
import {
  actorInitials,
  actorRingClass,
  changeSummary,
  formatAuditDateTime,
  getAuditTheme,
  hasAuditValue,
  readAuditMeta,
  resolveEntityDisplay,
} from '../audit-utils';
import { AuditActionBadge } from './AuditActionBadge';
import { AuditJsonPanel } from './AuditJsonPanel';

export function AuditEntryCard({ row }: { row: AuditRow }) {
  const [expanded, setExpanded] = useState(false);
  const { dateLine, timeLine, full } = formatAuditDateTime(row.createdAt);
  const summary = changeSummary(row);
  const theme = getAuditTheme(row.action, row.entityType);
  const entity = resolveEntityDisplay(row);
  const meta = readAuditMeta(row);
  const ip = row.ip || meta.ip;
  const showDetails = hasAuditValue(row.oldValue) || hasAuditValue(row.newValue);

  return (
    <article className={cn('border-b border-slate-100 border-l-[3px] last:border-b-0', theme.accent)}>
      <button
        type="button"
        onClick={() => showDetails && setExpanded((v) => !v)}
        className={cn(
          'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
          showDetails ? 'cursor-pointer hover:bg-slate-50/80' : 'cursor-default',
        )}
      >
        <div className="w-[96px] shrink-0 pt-0.5" title={full}>
          <p className="text-xs font-bold text-slate-800">{dateLine}</p>
          <p className="text-[11px] font-bold text-indigo-600">{timeLine}</p>
        </div>

        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white ring-2',
            actorRingClass(row.actor?.role),
          )}
          title={row.actor?.fullName || 'System'}
        >
          {actorInitials(row.actor?.fullName)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <AuditActionBadge action={row.action} entityType={row.entityType} />
            <span
              className={cn(
                'inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                theme.entity,
              )}
            >
              {row.entityType}
            </span>
          </div>

          <p className="text-sm font-black text-slate-900">{entity.primary}</p>
          <p className="font-mono text-[10px] font-semibold text-slate-400">{entity.secondary}</p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs font-bold text-slate-700">
              {row.actor?.fullName || 'System'}
            </span>
            {row.actor?.role && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {row.actor.role.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {summary && <p className="text-xs font-medium text-slate-500">{summary}</p>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
          {ip && (
            <span
              className="hidden items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline-flex"
              title={ip}
            >
              <Globe className="h-3 w-3" />
              {ip}
            </span>
          )}
          {showDetails && (
            expanded
              ? <ChevronDown className="h-4 w-4 text-slate-400" />
              : <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && showDetails && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2.5">
          {(ip || meta.userAgent) && (
            <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500">
              {ip && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3" /> IP: {ip}
                </span>
              )}
              {meta.userAgent && (
                <span className="inline-flex items-center gap-1 max-w-md truncate" title={meta.userAgent}>
                  <Monitor className="h-3 w-3 shrink-0" /> {meta.userAgent}
                </span>
              )}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {hasAuditValue(row.oldValue) && (
              <AuditJsonPanel label="Before" value={row.oldValue} variant="before" />
            )}
            {hasAuditValue(row.newValue) && (
              <AuditJsonPanel label="After" value={row.newValue} variant="after" />
            )}
          </div>
        </div>
      )}
    </article>
  );
}
