'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SmsLog, SmsQueueItem } from '@/lib/api/sms';
import { Panel } from '../sms-shared';

export function SmsLogsTab({
  logs,
  queue,
}: {
  logs: SmsLog[];
  queue: { summary: Record<string, number>; items: SmsQueueItem[] };
}) {
  return (
    <div className="space-y-4">
      <Panel title="Queue Status">
        <div className="grid gap-3 sm:grid-cols-4">
          {['QUEUED', 'SENDING', 'DELIVERED', 'FAILED'].map((status) => (
            <div key={status} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">{status}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{queue.summary?.[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Recent SMS Logs">
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm font-semibold text-slate-400">
                    No SMS logs yet.
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-32 truncate text-xs text-slate-500">{log.jobId || log.id}</TableCell>
                  <TableCell><Badge variant="outline">{log.context || log.type || 'manual'}</Badge></TableCell>
                  <TableCell className="text-xs font-bold text-slate-700">{log.smsType === 'non_masking' ? 'Non-masking' : 'Masking'}</TableCell>
                  <TableCell className="font-bold">{log.recipientCount}</TableCell>
                  <TableCell className="text-xs">
                    <span className="text-emerald-600">{log.successCount} delivered</span>
                    {log.failedCount ? <span className="ml-2 text-rose-600">{log.failedCount} failed</span> : null}
                  </TableCell>
                  <TableCell>৳{Number(log.cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="max-w-md truncate text-xs text-slate-500">{log.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
