'use client';

import Link from 'next/link';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadTableExport, type ExportFormat } from '@/lib/export';
import type { Branch } from '@/lib/api/branches';
import type { SmsLog, SmsLogStats, SmsReportRow } from '@/lib/api/sms';
import {
  EmptyState,
  Metric,
  Panel,
  formatBdt,
  paymentSmsSourceLabels,
  paymentSmsSources,
  smsTypeLabels,
} from '../sms-shared';
import { useSmsReports, type SmsReportFilters } from '../hooks/useSmsReports';

function exportFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}-${stamp}`;
}

function shortId(id?: string | null) {
  return id ? `ID ${id.slice(0, 8)}` : 'Not tagged';
}

function programLabel(row: SmsReportRow) {
  return row.programName || shortId(row.programId);
}

function batchLabel(row: SmsReportRow) {
  return row.batchName || shortId(row.batchId);
}

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function historyHref(filters: SmsReportFilters, type?: string) {
  const params = new URLSearchParams({ tab: 'logs' });
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.branchId) params.set('branchId', filters.branchId);
  if (type) params.set('type', type);
  return `/admin/sms?${params.toString()}`;
}

function OperationalSmsList({
  rows,
  emptyLabel,
  labelForRow,
  historyLink,
}: {
  rows: SmsLog[];
  emptyLabel: string;
  labelForRow: (row: SmsLog) => string;
  historyLink: string;
}) {
  if (rows.length === 0) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 6).map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold">{labelForRow(row)}</p>
            <p className="truncate text-slate-500">{row.message}</p>
            <p className="text-xs text-slate-400">{fmtDate(row.sentAt || row.scheduledAt)}</p>
          </div>
          <div className="shrink-0 text-right text-slate-500">
            <p>{row.successCount} sent</p>
            {row.failedCount > 0 ? <p className="text-rose-600">{row.failedCount} failed</p> : null}
            {row.cost != null ? <p className="text-xs">{formatBdt(row.cost)}</p> : null}
          </div>
        </div>
      ))}
      <div className="pt-1">
        <Button type="button" variant="ghost" size="sm" className="gap-2" asChild>
          <Link href={historyLink}>
            View all in History
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function UsageBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-2 h-2 rounded bg-slate-100">
      <div className="h-2 rounded bg-blue-600 transition-all" style={{ width: `${width}%` }} />
    </div>
  );
}

export function SmsReportsTab({
  branches,
  actor,
}: {
  branches: Branch[];
  actor?: { role?: string | null; branchId?: string | null };
}) {
  const reports = useSmsReports(branches, actor);
  const {
    loading,
    loadError,
    filters,
    updateFilters,
    setPaymentSourceFilter,
    loadReports,
    monthlyRows,
    typeReport,
    branchReport,
    programReport,
    batchReport,
    dueReport,
    paymentReport,
    resultReport,
    stats,
    isBranchAdmin,
  } = reports;

  const typeMax = Math.max(...typeReport.map((row) => Number(row._sum?.successCount || 0)), 1);

  const combinedRows = [
    ...monthlyRows.map((row) => ({
      section: 'MONTHLY',
      name: row.month,
      branch: '',
      success: row.successCount,
      failed: row.failedCount,
      recipients: row.recipientCount,
      cost: '',
      message: '',
    })),
    ...typeReport.map((row) => ({
      section: 'TYPE',
      name: row.type || 'Unknown',
      branch: '',
      success: Number(row._sum?.successCount || 0),
      failed: Number(row._sum?.failedCount || 0),
      recipients: Number(row._sum?.recipientCount || 0),
      cost: row._sum?.cost ?? '',
      message: '',
    })),
    ...branchReport.map((row) => ({
      section: 'BRANCH',
      name: branches.find((branch) => branch.id === row.branchId)?.name || 'Central / Unknown',
      branch: row.branchId || '',
      success: Number(row._sum?.successCount || 0),
      failed: Number(row._sum?.failedCount || 0),
      recipients: Number(row._sum?.recipientCount || 0),
      cost: row._sum?.cost ?? '',
      message: '',
    })),
    ...programReport.map((row) => ({
      section: 'PROGRAM',
      name: programLabel(row),
      branch: '',
      success: Number(row._sum?.successCount || 0),
      failed: Number(row._sum?.failedCount || 0),
      recipients: Number(row._sum?.recipientCount || 0),
      cost: row._sum?.cost ?? '',
      message: '',
    })),
    ...batchReport.map((row) => ({
      section: 'BATCH',
      name: batchLabel(row),
      branch: '',
      success: Number(row._sum?.successCount || 0),
      failed: Number(row._sum?.failedCount || 0),
      recipients: Number(row._sum?.recipientCount || 0),
      cost: row._sum?.cost ?? '',
      message: '',
    })),
    ...dueReport.map((row) => ({
      section: 'DUE',
      name: row.type || 'Due',
      branch: row.scope,
      success: row.successCount,
      failed: row.failedCount,
      recipients: row.recipientCount,
      cost: row.cost ?? '',
      message: row.message,
    })),
    ...paymentReport.map((row) => ({
      section: 'PAYMENT',
      name: row.paymentSource
        ? (paymentSmsSourceLabels[row.paymentSource] || row.paymentSource)
        : (row.type || 'Payment'),
      branch: row.scope,
      success: row.successCount,
      failed: row.failedCount,
      recipients: row.recipientCount,
      cost: row.cost ?? '',
      message: row.message,
    })),
    ...resultReport.map((row) => ({
      section: 'RESULT',
      name: row.type || 'Result',
      branch: row.scope,
      success: row.successCount,
      failed: row.failedCount,
      recipients: row.recipientCount,
      cost: row.cost ?? '',
      message: row.message,
    })),
  ];

  async function handleExport(format: ExportFormat) {
    if (combinedRows.length === 0) return;
    await downloadTableExport({
      format,
      filename: exportFilename('sms-reports'),
      sheetName: 'SMS Reports',
      rows: combinedRows,
      columns: [
        { header: 'Section', value: (row) => row.section },
        { header: 'Name', value: (row) => row.name },
        { header: 'Scope / Branch', value: (row) => row.branch },
        { header: 'Success', value: (row) => row.success },
        { header: 'Failed', value: (row) => row.failed },
        { header: 'Recipients', value: (row) => row.recipients },
        { header: 'Cost (BDT)', value: (row) => row.cost },
        { header: 'Message', value: (row) => row.message },
      ],
    });
  }

  return (
    <div className="space-y-4">
      <Panel title="Report Filters">
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</span>
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => updateFilters({ from: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</span>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => updateFilters({ to: event.target.value })}
            />
          </label>
          {!isBranchAdmin ? (
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</span>
              <Select
                value={filters.branchId || 'ALL'}
                onValueChange={(value) => updateFilters({ branchId: value === 'ALL' ? '' : value })}
              >
                <SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : null}
          <div className="flex items-end gap-2 lg:col-span-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void loadReports()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2" disabled={combinedRows.length === 0} onClick={() => void handleExport('csv')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2" disabled={combinedRows.length === 0} onClick={() => void handleExport('xlsx')}>
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
        {loadError ? <p className="mt-3 text-sm text-rose-600">{loadError}</p> : null}
      </Panel>

      <ReportStats stats={stats} loading={loading} />

      <Panel title="Monthly Summary">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {monthlyRows.slice(-8).map((row) => (
            <div key={row.month} className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">{row.month}</p>
              <p className="mt-1 text-xl font-bold">{row.successCount}</p>
              <p className="text-xs text-slate-500">{row.failedCount} failed · {row.recipientCount} recipients</p>
            </div>
          ))}
          {!loading && monthlyRows.length === 0 && <EmptyState>No monthly SMS data for this range.</EmptyState>}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Usage By Type">
          <div className="space-y-2">
            {typeReport.map((row) => (
              <div key={row.type || 'unknown'} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">{smsTypeLabels[row.type || ''] || row.type || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
                </div>
                <UsageBar value={Number(row._sum?.successCount || 0)} max={typeMax} />
                <p className="mt-1 text-xs text-slate-400">
                  {row._sum?.failedCount || 0} failed · {formatBdt(row._sum?.cost)}
                </p>
              </div>
            ))}
            {!loading && typeReport.length === 0 && <EmptyState>No type usage for this range.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Branch Usage">
          <div className="space-y-2">
            {branchReport.map((row) => (
              <div key={row.branchId || 'central'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{branches.find((branch) => branch.id === row.branchId)?.name || 'Central / Unknown'}</p>
                  <p className="text-xs text-slate-400">{row._sum?.failedCount || 0} failed · {formatBdt(row._sum?.cost)}</p>
                </div>
                <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
              </div>
            ))}
            {!loading && branchReport.length === 0 && <EmptyState>No branch usage for this range.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Program Usage">
          <div className="space-y-2">
            {programReport.slice(0, 8).map((row) => (
              <div key={row.programId || 'none'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <p className="truncate font-semibold">{programLabel(row)}</p>
                <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
              </div>
            ))}
            {!loading && programReport.length === 0 && <EmptyState>No program-tagged SMS for this range.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Batch Usage">
          <div className="space-y-2">
            {batchReport.slice(0, 8).map((row) => (
              <div key={row.batchId || 'none'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <p className="truncate font-semibold">{batchLabel(row)}</p>
                <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
              </div>
            ))}
            {!loading && batchReport.length === 0 && <EmptyState>No batch-tagged SMS for this range.</EmptyState>}
          </div>
        </Panel>
      </div>

      <Panel title="Operational Reports">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment SMS source</span>
            <select
              value={filters.paymentSource}
              onChange={(event) => setPaymentSourceFilter(event.target.value)}
              className="h-10 min-w-56 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {paymentSmsSources.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Due SMS" value={dueReport.reduce((sum, row) => sum + row.successCount, 0)} tone="amber" />
          <Metric label="Payment SMS" value={paymentReport.reduce((sum, row) => sum + row.successCount, 0)} tone="emerald" />
          <Metric label="Result SMS" value={resultReport.reduce((sum, row) => sum + row.successCount, 0)} tone="blue" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Due reminders</h3>
            <OperationalSmsList
              rows={dueReport}
              emptyLabel="No due SMS for this range."
              labelForRow={(row) => row.campaignName || smsTypeLabels.DUE_REMINDER}
              historyLink={historyHref(filters, 'DUE_REMINDER')}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Payment confirmations</h3>
            <OperationalSmsList
              rows={paymentReport}
              emptyLabel={filters.paymentSource ? 'No payment SMS for this source in range.' : 'No payment SMS for this range.'}
              labelForRow={(row) => (
                row.paymentSource
                  ? (paymentSmsSourceLabels[row.paymentSource] || row.paymentSource)
                  : 'Payment confirmation'
              )}
              historyLink={historyHref(filters, 'PAYMENT_CONFIRMATION')}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Result notifications</h3>
            <OperationalSmsList
              rows={resultReport}
              emptyLabel="No result SMS for this range."
              labelForRow={(row) => row.campaignName || row.context || smsTypeLabels.RESULT}
              historyLink={historyHref(filters, 'RESULT')}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Full SMS History">
        <p className="text-sm text-slate-600">
          Detailed campaign logs, recipient drill-down, and retry actions live in the History tab.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={historyHref(filters)}>Open History with current filters</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={historyHref(filters, 'DUE_REMINDER')}>Due SMS history</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={historyHref(filters, 'PAYMENT_CONFIRMATION')}>Payment SMS history</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={historyHref(filters, 'RESULT')}>Result SMS history</Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function ReportStats({ stats, loading }: { stats: SmsLogStats | null; loading: boolean }) {
  if (loading && !stats) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {['Sent', 'Delivered', 'Failed', 'Cost'].map((label) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-300">—</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Recipients" value={stats?.sent ?? 0} tone="slate" />
      <Metric label="Delivered" value={`${stats?.delivered ?? 0} (${stats?.deliveryRate ?? 0}%)`} tone="emerald" />
      <Metric label="Failed" value={stats?.failed ?? 0} tone="amber" />
      <Metric label="Cost" value={formatBdt(stats?.cost)} tone="blue" />
    </div>
  );
}
