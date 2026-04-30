'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SmsLogRecipient = {
  id: string;
  mobile: string;
  status: string;
  error?: string | null;
};

type SmsLogDetailsData = {
  recipientCount: number;
  successCount: number;
  failedCount: number;
  recipients?: SmsLogRecipient[];
};

export function SmsLogDetails({ log }: { log: SmsLogDetailsData }) {
  return (
    <div className="space-y-8 p-4">
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-[24px] bg-slate-50 p-6 border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Pool</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{log.recipientCount}</p>
        </div>
        <div className="rounded-[24px] bg-indigo-50 p-6 border border-indigo-100 shadow-sm text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Delivered</p>
          <p className="text-3xl font-black text-indigo-600 tracking-tighter">{log.successCount}</p>
        </div>
        <div className="rounded-[24px] bg-rose-50 p-6 border border-rose-100 shadow-sm text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">Suppressed</p>
          <p className="text-3xl font-black text-rose-600 tracking-tighter">{log.failedCount}</p>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 overflow-hidden bg-white shadow-xl shadow-slate-200/20">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Mobile Identity</th>
              <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
              <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">System Log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {log.recipients?.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-slate-700">{r.mobile}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={cn('text-[9px] font-black uppercase px-3 py-1 rounded-full', r.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100')}>
                    {r.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic">
                  {r.error || 'SENT'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
