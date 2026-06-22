'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Download, Eye, RefreshCw, RotateCcw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  getSmsLogRecipients,
  getSmsLogs,
  getSmsLogStats,
  retryFailedSmsLog,
  retrySmsRecipient,
  type SmsLog,
  type SmsLogStats,
  type SmsRecipientLog,
} from '@/lib/api/sms';
import type { Branch } from '@/lib/api/branches';
import { Panel, smsLengthInfo } from '../sms-shared';

type Actor = { role?: string | null; branchId?: string | null };
type BranchOption = Pick<Branch, 'id' | 'name'>;
type InitialLogFilters = {
  from?: string;
  to?: string;
  type?: string;
  branchId?: string;
};

function money(value: unknown) {
  return `৳${Number(value || 0).toFixed(2)}`;
}

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function maskMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return value;
  return `${digits.slice(0, 5)}***${digits.slice(-3)}`;
}

function statusBadge(status: string) {
  if (status === 'DELIVERED') return <Badge className="bg-emerald-50 text-emerald-700">Delivered</Badge>;
  if (status === 'FAILED') return <Badge className="bg-rose-50 text-rose-700">Failed</Badge>;
  if (status === 'SENDING') return <Badge className="bg-blue-50 text-blue-700">Sending</Badge>;
  return <Badge className="bg-amber-50 text-amber-700">Pending</Badge>;
}

export function SmsLogsTab({
  branches,
  actor,
  initialFilters,
}: {
  branches: BranchOption[];
  actor?: Actor;
  initialFilters?: InitialLogFilters;
}) {
  const { toast } = useToast();
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [stats, setStats] = useState<SmsLogStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: initialFilters?.from || '',
    to: initialFilters?.to || '',
    type: initialFilters?.type || 'ALL',
    branchId: initialFilters?.branchId || '',
    status: 'ALL',
    search: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeLog, setActiveLog] = useState<SmsLog | null>(null);
  const [drawerStatus, setDrawerStatus] = useState('ALL');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (!initialFilters) return;
    setFilters((prev) => ({
      ...prev,
      from: initialFilters.from || prev.from,
      to: initialFilters.to || prev.to,
      type: initialFilters.type || prev.type,
      branchId: initialFilters.branchId || prev.branchId,
    }));
  }, [initialFilters?.branchId, initialFilters?.from, initialFilters?.to, initialFilters?.type]);

  const query = useMemo(() => ({
    page: pagination.page,
    limit: pagination.limit,
    from: filters.from || undefined,
    to: filters.to || undefined,
    type: filters.type === 'ALL' ? undefined : filters.type,
    branchId: isBranchAdmin ? actor?.branchId || undefined : filters.branchId || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    search: debouncedSearch || undefined,
  }), [actor?.branchId, debouncedSearch, filters.branchId, filters.from, filters.status, filters.to, filters.type, isBranchAdmin, pagination.limit, pagination.page]);

  async function load() {
    setLoading(true);
    try {
      const [logRes, statsRes] = await Promise.all([
        getSmsLogs(query),
        getSmsLogStats(query),
      ]);
      if (logRes.success) {
        setLogs(logRes.data || []);
        setPagination(logRes.pagination || pagination);
      }
      if (statsRes.success) setStats(statsRes.data);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to load SMS history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function openDrawer(log: SmsLog, status = 'ALL') {
    setActiveLog(log);
    setDrawerStatus(status);
  }

  return (
    <div className="space-y-4">
      <Panel title="History Filters">
        <div className="grid gap-3 lg:grid-cols-6">
          <Input type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
          <Select value={filters.type} onValueChange={(type) => setFilters((prev) => ({ ...prev, type }))}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              {['ALL', 'RESULT', 'DUE_REMINDER', 'PAYMENT_CONFIRMATION', 'BULK', 'DIRECT', 'OTP', 'NOTICE'].map((type) => <SelectItem key={type} value={type}>{type === 'ALL' ? 'All types' : type}</SelectItem>)}
            </SelectContent>
          </Select>
          {!isBranchAdmin ? (
            <Select value={filters.branchId || 'ALL'} onValueChange={(branchId) => setFilters((prev) => ({ ...prev, branchId: branchId === 'ALL' ? '' : branchId }))}>
              <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All branches</SelectItem>
                {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <Select value={filters.status} onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="FAILED">Has failures</SelectItem>
              <SelectItem value="DELIVERED">All delivered</SelectItem>
            </SelectContent>
          </Select>
          <Input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search campaign" />
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Sent" value={stats?.sent ?? 0} />
        <Stat label="Delivered" value={`${stats?.delivered ?? 0} (${stats?.deliveryRate ?? 0}%)`} tone="emerald" />
        <Stat label="Failed" value={stats?.failed ?? 0} tone="rose" />
        <Stat label="Cost" value={money(stats?.cost)} tone="blue" />
      </div>

      <Panel title="Sent Log" action={<Button type="button" variant="outline" size="sm" onClick={() => void load()} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>}>
        <div className="hidden overflow-x-auto rounded-md border border-slate-200 lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Campaign / Type</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">No SMS history found.</TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDrawer(log)}>
                  <TableCell className="text-sm text-slate-600">{fmtDate(log.sentAt || log.scheduledAt)}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{log.campaignName || log.context || log.type || 'SMS Campaign'}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline">{log.type || 'NOTICE'}</Badge>
                      <Badge variant="outline">{log.smsType === 'non_masking' ? 'NON-MASKING' : 'MASKING'}</Badge>
                      {log.scheduledAt ? <Badge variant="outline">SCHED</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{log.recipientCount}</TableCell>
                  <TableCell className="font-bold text-emerald-700">{log.successCount}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className={log.failedCount ? 'font-bold text-rose-700 underline-offset-2 hover:underline' : 'text-slate-500'}
                      onClick={(event) => {
                        event.stopPropagation();
                        openDrawer(log, 'FAILED');
                      }}
                    >
                      {log.failedCount}
                    </button>
                  </TableCell>
                  <TableCell>{money(log.cost)}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); openDrawer(log); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 lg:hidden">
          {logs.map((log) => (
            <button key={log.id} type="button" onClick={() => openDrawer(log)} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{log.campaignName || log.context || log.type || 'SMS Campaign'}</p>
                  <p className="text-xs text-slate-500">{fmtDate(log.sentAt || log.scheduledAt)}</p>
                </div>
                <Badge variant="outline">{log.type || 'NOTICE'}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <StatMini label="To" value={log.recipientCount} />
                <StatMini label="Ok" value={log.successCount} />
                <StatMini label="Fail" value={log.failedCount} />
                <StatMini label="Cost" value={money(log.cost)} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>Showing page {pagination.page} of {pagination.pages || 1} ({pagination.total} campaigns)</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>Prev</Button>
            <Button type="button" variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
          </div>
        </div>
      </Panel>

      {activeLog ? (
        <SmsRecipientDrawer
          log={activeLog}
          initialStatus={drawerStatus}
          onClose={() => setActiveLog(null)}
          onUpdated={() => void load()}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'rose' | 'blue' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-700' : tone === 'blue' ? 'text-blue-700' : 'text-slate-950';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-md bg-slate-50 px-2 py-1">
      <span className="block text-slate-400">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </span>
  );
}

function SmsRecipientDrawer({
  log,
  initialStatus,
  onClose,
  onUpdated,
}: {
  log: SmsLog;
  initialStatus: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [recipients, setRecipients] = useState<SmsRecipientLog[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadRecipients(nextStatus = status) {
    setLoading(true);
    try {
      const res = await getSmsLogRecipients(log.id, {
        page: 1,
        limit: 100,
        status: nextStatus === 'ALL' ? undefined : nextStatus,
        search: search || undefined,
      });
      if (res.success) setRecipients(res.data || []);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to load recipients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus, log.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecipients(), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, log.id]);

  async function retryAll() {
    try {
      const res = await retryFailedSmsLog(log.id);
      toast({ title: res.message || 'Retry queued' });
      await loadRecipients();
      onUpdated();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Retry failed', variant: 'destructive' });
    }
  }

  async function retryOne(recipient: SmsRecipientLog) {
    try {
      const res = await retrySmsRecipient(log.id, recipient.id);
      toast({ title: res.message || 'Retry queued' });
      await loadRecipients();
      onUpdated();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Retry failed', variant: 'destructive' });
    }
  }

  function exportCsv() {
    const rows = [
      'mobile,status,sentAt,error,message',
      ...recipients.map((row) => [row.mobile, row.status, row.sentAt || '', row.error || '', row.resolvedMessage || row.message || ''].map((value) => JSON.stringify(value)).join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sms-history-${log.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" aria-label="Close history drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-5xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">SMS History</p>
              <h2 className="text-lg font-bold text-slate-950">{log.campaignName || log.context || log.type || 'SMS Campaign'}</h2>
              <p className="text-sm text-slate-500">{log.type || 'NOTICE'} | {log.source || 'SYSTEM'} | {log.smsType === 'non_masking' ? 'Non-masking' : 'Masking'} | {money(log.cost)}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={retryAll} disabled={!log.failedCount} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry Failed ({log.failedCount})
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadRecipients()} disabled={loading}>Refresh</Button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">View campaign message</summary>
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-slate-700">{log.message}</p>
          </details>

          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'DELIVERED', 'FAILED', 'QUEUED'].map((item) => (
              <Button key={item} type="button" size="sm" variant={status === item ? 'default' : 'outline'} onClick={() => setStatus(item)}>
                {item === 'ALL' ? 'All' : item}
              </Button>
            ))}
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mobile, message, error" className="w-full sm:w-80" />
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Retry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">No recipients found.</TableCell></TableRow>
                ) : recipients.map((recipient) => {
                  const detail = recipient.resolvedMessage || recipient.message || '';
                  const info = smsLengthInfo(detail);
                  return (
                    <Fragment key={recipient.id}>
                      <TableRow key={recipient.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(expanded === recipient.id ? null : recipient.id)}>
                        <TableCell>
                          <p className="font-semibold text-slate-900">{recipient.recipientUserId ? 'Student' : 'Manual'}</p>
                          <p className="text-xs text-slate-500">{maskMobile(recipient.mobile)}</p>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{fmtDate(recipient.sentAt)}</TableCell>
                        <TableCell>{statusBadge(recipient.status)}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-rose-600">{recipient.error || '—'}</TableCell>
                        <TableCell className="text-right">
                          {recipient.status === 'FAILED' ? (
                            <Button type="button" variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); void retryOne(recipient); }}>
                              Retry
                            </Button>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                      {expanded === recipient.id ? (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-slate-50">
                            <div className="rounded-md border border-slate-200 bg-white p-3">
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{detail || 'No message captured.'}</p>
                              <p className="mt-3 text-xs text-slate-500">
                                Chars: {info.length} | Segments: {Math.max(1, info.segments)} | Type: {info.encoding} | Provider Ref: {recipient.providerRef || log.providerRef || '—'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </aside>
    </div>
  );
}
