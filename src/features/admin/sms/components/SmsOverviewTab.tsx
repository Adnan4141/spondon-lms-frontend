'use client';

import { CheckCircle2, Clock, Loader2, XCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SmsConfig, SmsQueueItem } from '@/lib/api/sms';
import { EmptyState, Panel, StatusBadge } from '../sms-shared';

const QUEUE_STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; text: string }> = {
  QUEUED:    { icon: Clock,         color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-900' },
  SENDING:   { icon: Loader2,       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-900' },
  DELIVERED: { icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-900' },
  FAILED:    { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-900' },
};

export function SmsOverviewTab({
  queue,
  config,
  providerBalanceValue,
  providerBalanceError,
  failedQueue,
}: {
  queue: { summary: Record<string, number>; items: SmsQueueItem[] };
  config: Partial<SmsConfig>;
  providerBalanceValue: string;
  providerBalanceError: string;
  failedQueue: SmsQueueItem[];
}) {
  const gatewayNotConfigured = providerBalanceValue === 'Gateway not configured';
  const isConnected = !providerBalanceError;
  const isNotConfigured = gatewayNotConfigured;
  const providerLabel = config.provider?.trim() || 'Shiram';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* ── Queue Status ── */}
        <Panel title="Queue Status">
          <div className="grid gap-3 sm:grid-cols-4">
            {(['QUEUED', 'SENDING', 'DELIVERED', 'FAILED'] as const).map((status) => {
              const cfg = QUEUE_STATUS_CONFIG[status];
              const Icon = cfg.icon;
              const count = queue.summary?.[status] ?? 0;
              return (
                <div key={status} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{status}</p>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color} ${status === 'SENDING' && count > 0 ? 'animate-spin' : ''}`} />
                  </div>
                  <p className={`mt-1.5 text-2xl font-bold ${cfg.text}`}>{count}</p>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* ── Gateway Status ── */}
        <Panel title="Gateway Status">
          <div className="space-y-3">
            {/* Balance hero */}
            <div
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                isConnected
                  ? 'border-emerald-200 bg-emerald-50'
                  : isNotConfigured
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                  isConnected ? 'bg-emerald-100' : 'bg-slate-100'
                }`}
              >
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-emerald-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining credit (BDT)</p>
                <p
                  className={`truncate text-xl font-bold ${
                    isConnected ? 'text-emerald-800' : isNotConfigured ? 'text-slate-400' : 'text-amber-800'
                  }`}
                >
                  {providerBalanceValue}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`ml-auto flex-shrink-0 ${
                  isConnected
                    ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                    : isNotConfigured
                      ? 'border-slate-200 bg-white text-slate-500'
                      : 'border-amber-300 bg-amber-100 text-amber-700'
                }`}
              >
                {isConnected ? 'Connected' : isNotConfigured ? 'Not configured' : 'Warning'}
              </Badge>
            </div>
            {providerBalanceError && !isNotConfigured && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <span className="font-semibold">Provider warning: </span>
                {providerBalanceError}
              </p>
            )}
            {/* Provider detail row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Provider</p>
                <p className="mt-1 truncate font-semibold text-slate-800">{providerLabel}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Gateway</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${config.isActive === false ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}`}
                >
                  {config.isActive === false ? 'Inactive' : 'Active'}
                </Badge>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Masking mask</p>
                <p className="mt-1 truncate font-semibold text-slate-800">{config.senderId || '—'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Non-masking</p>
                <p className="mt-1 truncate font-semibold text-slate-800">{config.nonMaskingNumber || '—'}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Recent Queue ── */}
        <Panel title="Recent Queue">
          <div className="space-y-2">
            {queue.items.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{item.mobile}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.type || 'SMS'} · priority {item.priority}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {queue.items.length === 0 && <EmptyState>No queued SMS yet.</EmptyState>}
          </div>
        </Panel>

        {/* ── Recent Failed SMS ── */}
        <Panel title="Recent Failed SMS">
          <div className="space-y-2">
            {failedQueue.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-red-800">{item.mobile}</p>
                  <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-red-600">{item.message}</p>
                {item.type && (
                  <p className="mt-1 text-xs font-semibold text-red-400">{item.type}</p>
                )}
              </div>
            ))}
            {failedQueue.length === 0 && <EmptyState>No failed queue items in the latest window.</EmptyState>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
