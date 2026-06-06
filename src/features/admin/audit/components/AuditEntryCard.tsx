'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Globe } from 'lucide-react';
import type { AuditRow } from '@/lib/api/audit';
import { cn } from '@/lib/utils';
import {
  actorInitials,
  actorRingClass,
  changeSummary,
  formatAuditDateTime,
  formatIpDisplay,
  getAuditTheme,
  getPayloadForPanel,
  hasAuditValue,
  readConnectionInfo,
  resolveEntityDisplay,
} from '../audit-utils';
import { AuditActionBadge } from './AuditActionBadge';
import { AuditConnectionPanel } from './AuditConnectionPanel';
import { AuditJsonPanel } from './AuditJsonPanel';

export function AuditEntryCard({ row }: { row: AuditRow }) {
  const [expanded, setExpanded] = useState(false);
  const { dateLine, timeLine, full } = formatAuditDateTime(row.createdAt);
  const summary = changeSummary(row);
  const theme = getAuditTheme(row.action, row.entityType);
  const entity = resolveEntityDisplay(row);
  const connection = readConnectionInfo(row);
  const ipDisplay = formatIpDisplay(connection.ip);
  const oldPayload = getPayloadForPanel(row.oldValue);
  const newPayload = getPayloadForPanel(row.newValue);
  const showDetails =
    hasAuditValue(row.oldValue) ||
    hasAuditValue(row.newValue) ||
    Boolean(connection.ip || connection.userAgent || connection.mobile);

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
          {connection.ip && (
            <span
              className="hidden items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-flex"
              title={ipDisplay.secondary ?? connection.ip}
            >
              <Globe className="h-3 w-3" />
              <span className="font-bold text-slate-700">{ipDisplay.primary}</span>
              {ipDisplay.secondary && (
                <span className="font-mono text-[9px] text-slate-400">({connection.ip})</span>
              )}
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
          <AuditConnectionPanel info={connection} />

          {(oldPayload || newPayload) && (
            <div className="grid gap-2 sm:grid-cols-2">
              {oldPayload && (
                <AuditJsonPanel label="Before" value={oldPayload} variant="before" />
              )}
              {newPayload && (
                <AuditJsonPanel label="After" value={newPayload} variant="after" />
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
