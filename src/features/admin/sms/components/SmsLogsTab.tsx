'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { 
  Download, 
  Eye, 
  RefreshCw, 
  RotateCcw, 
  X, 
  Search, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Smartphone,
  Info,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
  if (status === 'DELIVERED') {
    return (
      <Badge variant="outline" className="bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-50/70 flex items-center gap-1.5 px-2 py-0.5 font-medium rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Delivered
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge variant="outline" className="bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-50/70 flex items-center gap-1.5 px-2 py-0.5 font-medium rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Failed
      </Badge>
    );
  }
  if (status === 'SENDING') {
    return (
      <Badge variant="outline" className="bg-blue-50/70 border-blue-200 text-blue-700 hover:bg-blue-50/70 flex items-center gap-1.5 px-2 py-0.5 font-medium rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        Sending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-amber-50/70 border-amber-200 text-amber-700 hover:bg-amber-50/70 flex items-center gap-1.5 px-2 py-0.5 font-medium rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      Pending
    </Badge>
  );
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // ignore
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md px-2.5 transition-all"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-600 font-semibold">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </Button>
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
  const [messageExpanded, setMessageExpanded] = useState(true);

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
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-y-0 right-0 left-auto top-0 z-50 flex h-full w-full sm:max-w-4xl lg:max-w-5xl translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 border-l p-0 shadow-2xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-650">SMS History</p>
              <DialogTitle className="truncate text-lg font-bold text-slate-950 mt-0.5">
                {log.campaignName || log.context || log.type || 'SMS Campaign'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                SMS logs and recipients details for {log.campaignName || log.context || log.type}
              </DialogDescription>

              {/* Header Stats Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Campaign Type</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="secondary" className="font-semibold text-[10px] text-slate-705 bg-slate-200/60 px-2 py-0.5 rounded-md border-0">{log.type || 'NOTICE'}</Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gateway Type</div>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                    {log.smsType === 'non_masking' ? 'Non-Masking' : 'Masking'}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Cost</div>
                  <div className="mt-1 flex items-center gap-1 font-semibold text-xs text-blue-700">
                    <Coins className="h-3.5 w-3.5 text-blue-500" />
                    {money(log.cost)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Source</div>
                  <div className="mt-1 flex items-center gap-1 font-semibold text-xs text-slate-800 uppercase">
                    {log.source || 'SYSTEM'}
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 h-9 w-9 p-0 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Recipients:</span>
                <span className="rounded-full bg-slate-200 font-bold text-slate-700 px-2 py-0.5">{log.recipientCount}</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Delivered:</span>
                <span className="rounded-full bg-emerald-100/70 font-bold text-emerald-700 px-2 py-0.5">{log.successCount}</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Failed:</span>
                <span className="rounded-full bg-rose-100/70 font-bold text-rose-700 px-2 py-0.5">{log.failedCount}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={log.failedCount ? 'destructive' : 'outline'}
                size="sm"
                onClick={retryAll}
                disabled={!log.failedCount || loading}
                className={cn(
                  'gap-1.5 shadow-sm transition-all',
                  log.failedCount && 'bg-rose-600 hover:bg-rose-700 text-white border-0'
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Failed ({log.failedCount})</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 shadow-sm">
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadRecipients()}
                disabled={loading}
                className="gap-1.5 shadow-sm"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5 space-y-5">
          {/* Message Preview Accordion */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
            <div
              className="flex items-center justify-between bg-slate-50/70 px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setMessageExpanded(!messageExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Campaign Message Content</h3>
                  <p className="text-[10px] text-slate-400">The template content pushed to all recipients</p>
                </div>
              </div>
              <div className="flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
                <CopyButton text={log.message} />
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setMessageExpanded(!messageExpanded)}
                  aria-label={messageExpanded ? 'Collapse' : 'Expand'}
                >
                  {messageExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {messageExpanded && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/20 space-y-3">
                <div className="whitespace-pre-wrap rounded-lg border border-slate-150 bg-slate-50/70 p-3.5 text-sm text-slate-700 leading-relaxed font-mono">
                  {log.message}
                </div>
                {log.message && (() => {
                  const info = smsLengthInfo(log.message);
                  return (
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 font-medium">
                      <div>Characters: <span className="font-semibold text-slate-700">{info.length}</span></div>
                      <div>Segments: <span className="font-semibold text-slate-700">{Math.max(1, info.segments)}</span></div>
                      <div>Encoding: <span className="font-semibold text-slate-700 uppercase">{info.encoding}</span></div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-205/50 p-1 shrink-0">
              {['ALL', 'DELIVERED', 'FAILED', 'QUEUED'].map((item) => {
                const isActive = status === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all',
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    )}
                    onClick={() => setStatus(item)}
                  >
                    {item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mobile, error..."
                className="pl-9 bg-white shadow-xs focus-visible:ring-blue-500 text-sm border-slate-200 h-9"
              />
            </div>
          </div>

          {/* Recipient List - Desktop View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px] font-semibold text-slate-750">Recipient</TableHead>
                  <TableHead className="w-[180px] font-semibold text-slate-750">Sent At</TableHead>
                  <TableHead className="w-[140px] font-semibold text-slate-750">Status</TableHead>
                  <TableHead className="font-semibold text-slate-750">Delivery Error / Info</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold text-slate-750">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                      <p className="mt-2 text-sm text-slate-500 font-medium">Loading recipient logs...</p>
                    </TableCell>
                  </TableRow>
                ) : recipients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-650">No recipients found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                    </TableCell>
                  </TableRow>
                ) : recipients.map((recipient) => {
                  const detail = recipient.resolvedMessage || recipient.message || '';
                  const info = smsLengthInfo(detail);
                  const isExpanded = expanded === recipient.id;
                  return (
                    <Fragment key={recipient.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer hover:bg-slate-50/60 transition-colors',
                          isExpanded && 'bg-slate-50/50'
                        )}
                        onClick={() => setExpanded(isExpanded ? null : recipient.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="rounded-full bg-slate-100 p-1.5 text-slate-650">
                              {recipient.recipientUserId ? <User className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {recipient.recipientUserId ? 'Student' : 'Manual Recipient'}
                              </div>
                              <div className="text-xs font-mono text-slate-500 mt-0.5">{recipient.mobile}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 font-medium">{fmtDate(recipient.sentAt)}</TableCell>
                        <TableCell>{statusBadge(recipient.status)}</TableCell>
                        <TableCell>
                          {recipient.error ? (
                            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[280px]" title={recipient.error}>{recipient.error}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {recipient.status === 'FAILED' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-2.5"
                                onClick={() => void retryOne(recipient)}
                              >
                                Retry
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-100 rounded-md"
                              onClick={() => setExpanded(isExpanded ? null : recipient.id)}
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50/20 hover:bg-slate-50/20">
                          <TableCell colSpan={5} className="p-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                              <div>
                                <div className="text-xs font-semibold text-slate-500 mb-1.5">Message Content Sent to Recipient:</div>
                                <div className="rounded-lg border border-slate-150 bg-slate-50 p-3 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-mono">
                                  {detail || 'No message captured.'}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-550 border-t border-slate-100 pt-3">
                                <div>Chars: <span className="font-semibold text-slate-700">{info.length}</span></div>
                                <div>Segments: <span className="font-semibold text-slate-700">{Math.max(1, info.segments)}</span></div>
                                <div>Encoding: <span className="font-semibold text-slate-700 uppercase">{info.encoding}</span></div>
                                <div>Provider Ref: <span className="font-semibold text-slate-700 font-mono">{recipient.providerRef || log.providerRef || '—'}</span></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Recipient List - Mobile/Tablet View */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                <p className="mt-2 text-sm text-slate-500 font-medium">Loading recipient logs...</p>
              </div>
            ) : recipients.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-650">No recipients found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              recipients.map((recipient) => {
                const detail = recipient.resolvedMessage || recipient.message || '';
                const info = smsLengthInfo(detail);
                const isExpanded = expanded === recipient.id;
                return (
                  <div
                    key={recipient.id}
                    className={cn(
                      'rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200',
                      isExpanded ? 'ring-1 ring-blue-500/20 border-blue-200' : 'hover:border-slate-300'
                    )}
                  >
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : recipient.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-slate-100 p-2 text-slate-655 shrink-0">
                          {recipient.recipientUserId ? <User className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 leading-tight">
                            {recipient.recipientUserId ? 'Student' : 'Manual Recipient'}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-1">{recipient.mobile}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 text-right shrink-0">
                        {statusBadge(recipient.status)}
                        <span className="text-[10px] text-slate-400 font-medium">{fmtDate(recipient.sentAt)}</span>
                      </div>
                    </div>

                    {recipient.error && (
                      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-2 text-xs text-rose-700 border border-rose-100">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium leading-normal break-words">{recipient.error}</span>
                      </div>
                    )}

                    <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 p-1 -m-1"
                        onClick={() => setExpanded(isExpanded ? null : recipient.id)}
                      >
                        {isExpanded ? (
                          <>Hide Details <ChevronUp className="h-3.5 w-3.5" /></>
                        ) : (
                          <>View Details <ChevronDown className="h-3.5 w-3.5" /></>
                        )}
                      </button>

                      {recipient.status === 'FAILED' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2.5"
                          onClick={(event) => {
                            event.stopPropagation();
                            void retryOne(recipient);
                          }}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retry
                        </Button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2.5 rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 animate-in fade-in duration-200">
                        <div>
                          <div className="font-semibold text-slate-505 mb-1">Message Content:</div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5 whitespace-pre-wrap text-slate-800 break-words leading-relaxed font-mono">
                            {detail || 'No message captured.'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <div>Chars: <span className="font-semibold text-slate-700">{info.length}</span></div>
                          <div>Segments: <span className="font-semibold text-slate-700">{Math.max(1, info.segments)}</span></div>
                          <div>Encoding: <span className="font-semibold text-slate-700 uppercase">{info.encoding}</span></div>
                          <div className="col-span-2 truncate">Provider Ref: <span className="font-semibold text-slate-700 font-mono">{recipient.providerRef || log.providerRef || '—'}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
