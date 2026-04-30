'use client';

import type { Branch } from '@/lib/api/branches';
import type { SmsLog, SmsReportRow } from '@/lib/api/sms';
import { EmptyState, Metric, Panel } from '../sms-shared';

export function SmsReportsTab({
  monthlyRows,
  typeReport,
  branchReport,
  programReport,
  batchReport,
  dueReport,
  paymentReport,
  resultReport,
  logs,
  branches,
}: {
  monthlyRows: Array<{ month: string; successCount: number; failedCount: number; recipientCount: number }>;
  typeReport: SmsReportRow[];
  branchReport: SmsReportRow[];
  programReport: SmsReportRow[];
  batchReport: SmsReportRow[];
  dueReport: SmsLog[];
  paymentReport: SmsLog[];
  resultReport: SmsLog[];
  logs: SmsLog[];
  branches: Branch[];
}) {
  return (
    <div className="space-y-4">
      <Panel title="Monthly Summary">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {monthlyRows.slice(-8).map((row) => (
            <div key={row.month} className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">{row.month}</p>
              <p className="mt-1 text-xl font-bold">{row.successCount}</p>
              <p className="text-xs text-slate-500">{row.failedCount} failed</p>
            </div>
          ))}
          {monthlyRows.length === 0 && <EmptyState>No monthly SMS data yet.</EmptyState>}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Usage By Type">
          <div className="space-y-2">
            {typeReport.map((row) => (
              <div key={row.type || 'unknown'} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">{row.type || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
                </div>
                <div className="mt-2 h-2 rounded bg-slate-100">
                  <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.min(100, Number(row._sum?.successCount || 0))}%` }} />
                </div>
              </div>
            ))}
            {typeReport.length === 0 && <EmptyState>No type usage yet.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Branch Usage">
          <div className="space-y-2">
            {branchReport.map((row) => (
              <div key={row.branchId || 'central'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <p className="truncate font-semibold">{branches.find((branch) => branch.id === row.branchId)?.name || 'Central / Unknown'}</p>
                <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
              </div>
            ))}
            {branchReport.length === 0 && <EmptyState>No branch usage yet.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Program Usage">
          <div className="space-y-2">
            {programReport.slice(0, 8).map((row) => (
              <div key={row.programId || 'none'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <p className="truncate font-semibold">{row.programId || 'Not tagged'}</p>
                <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
              </div>
            ))}
            {programReport.length === 0 && <EmptyState>No program-tagged SMS yet.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Batch Usage">
          <div className="space-y-2">
            {batchReport.slice(0, 8).map((row) => (
              <div key={row.batchId || 'none'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <p className="truncate font-semibold">{row.batchId || 'Not tagged'}</p>
                <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
              </div>
            ))}
            {batchReport.length === 0 && <EmptyState>No batch-tagged SMS yet.</EmptyState>}
          </div>
        </Panel>
      </div>
      <Panel title="Operational Reports">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Due SMS" value={dueReport.reduce((sum, row) => sum + row.successCount, 0)} tone="amber" />
          <Metric label="Payment SMS" value={paymentReport.reduce((sum, row) => sum + row.successCount, 0)} tone="emerald" />
          <Metric label="Result SMS" value={resultReport.reduce((sum, row) => sum + row.successCount, 0)} tone="blue" />
        </div>
      </Panel>
      <Panel title="SMS History">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Scope</th>
                <th className="py-2 pr-3">Recipients</th>
                <th className="py-2 pr-3">Success</th>
                <th className="py-2 pr-3">Failed</th>
                <th className="py-2 pr-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{log.type || '-'}</td>
                  <td className="py-2 pr-3">{log.scope}</td>
                  <td className="py-2 pr-3">{log.recipientCount}</td>
                  <td className="py-2 pr-3">{log.successCount}</td>
                  <td className="py-2 pr-3">{log.failedCount}</td>
                  <td className="max-w-md truncate py-2 pr-3">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <EmptyState>No SMS history yet.</EmptyState>}
        </div>
      </Panel>
    </div>
  );
}
