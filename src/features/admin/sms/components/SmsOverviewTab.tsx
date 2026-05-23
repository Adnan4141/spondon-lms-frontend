'use client';

import { Badge } from '@/components/ui/badge';
import type { SmsConfig, SmsQueueItem } from '@/lib/api/sms';
import { EmptyState, Panel } from '../sms-shared';

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
  const providerLabel = config.provider?.trim() || 'Shiram';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Queue Status">
          <div className="grid gap-3 sm:grid-cols-4">
            {['QUEUED', 'SENDING', 'DELIVERED', 'FAILED'].map((status) => (
              <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">{status}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{queue.summary?.[status] ?? 0}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Gateway Status">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">Provider</p>
              <p className="mt-1 truncate font-semibold">{providerLabel}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">Gateway</p>
              <Badge variant="outline" className={config.isActive === false ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}>
                {config.isActive === false ? 'Inactive' : 'Active'}
              </Badge>
            </div>
            <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-3 sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500">Remaining credit (BDT)</p>
              <p className={providerBalanceError ? 'mt-1 truncate text-xl font-bold text-amber-700' : 'mt-1 truncate text-xl font-bold text-emerald-800'}>
                {providerBalanceValue}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">Masking sender</p>
              <p className="mt-1 truncate font-semibold">{config.senderId || '—'}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">Non-masking number</p>
              <p className="mt-1 truncate font-semibold">{config.nonMaskingNumber || '—'}</p>
            </div>
          </div>
          {providerBalanceError && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <span className="font-semibold">{gatewayNotConfigured ? 'Gateway not configured: ' : 'Provider warning: '}</span>
              {providerBalanceError}
            </p>
          )}
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent Queue">
          <div className="space-y-2">
            {queue.items.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.mobile}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.type || 'SMS'} · priority {item.priority}
                  </p>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </div>
            ))}
            {queue.items.length === 0 && <EmptyState>No queued SMS yet.</EmptyState>}
          </div>
        </Panel>
        <Panel title="Recent Failed SMS">
          <div className="space-y-2">
            {failedQueue.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm">
                <p className="font-semibold text-red-800">{item.mobile}</p>
                <p className="truncate text-xs text-red-600">{item.message}</p>
              </div>
            ))}
            {failedQueue.length === 0 && <EmptyState>No failed queue items in the latest queue window.</EmptyState>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
