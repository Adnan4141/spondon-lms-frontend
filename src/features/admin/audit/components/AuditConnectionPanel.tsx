import type { ReactNode } from 'react';
import { Globe, Monitor, Smartphone, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditConnectionInfo } from '../audit-utils';
import { formatIpDisplay, parseUserAgent } from '../audit-utils';

function DetailRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-x-3 gap-y-0.5 border-b border-slate-100 py-2 last:border-b-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className={cn('text-xs font-semibold text-slate-800', mono && 'font-mono text-[11px]')}>
        {children}
      </dd>
    </div>
  );
}

export function AuditConnectionPanel({ info }: { info: AuditConnectionInfo }) {
  const ip = formatIpDisplay(info.ip);
  const ua = parseUserAgent(info.userAgent);
  const hasContent = info.ip || info.userAgent || info.mobile || info.status || info.reason;

  if (!hasContent) return null;

  const statusTone =
    info.status === 'SUCCESS'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : info.status === 'FAILED'
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <Globe className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Connection &amp; session
        </span>
      </div>

      <dl className="px-3 py-1">
        {info.ip && (
          <DetailRow label="IP address">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-slate-400" />
                <span className="font-bold text-slate-900">{ip.primary}</span>
              </span>
              {ip.secondary && (
                <p className="font-mono text-[10px] font-medium text-slate-400">{ip.secondary}</p>
              )}
            </div>
          </DetailRow>
        )}

        {info.mobile && (
          <DetailRow label="Mobile" mono>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="h-3 w-3 text-slate-400" />
              {info.mobile}
            </span>
          </DetailRow>
        )}

        {info.status && (
          <DetailRow label="Status">
            <span
              className={cn(
                'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                statusTone,
              )}
            >
              {info.status}
            </span>
          </DetailRow>
        )}

        {info.reason != null && info.reason !== '' && (
          <DetailRow label="Reason">{info.reason}</DetailRow>
        )}

        {ua && (
          <>
            <DetailRow label="Browser">
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="h-3 w-3 text-slate-400" />
                {ua.browser}
                {ua.version ? ` ${ua.version}` : ''}
              </span>
            </DetailRow>
            <DetailRow label="OS / device">
              {ua.os}
              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                {ua.device}
              </span>
            </DetailRow>
          </>
        )}

        {info.userAgent && (
          <DetailRow label="User agent" mono>
            <div className="space-y-1">
              <p className="break-all leading-relaxed text-slate-600">{info.userAgent}</p>
              {ua && (
                <p className="text-[10px] font-medium text-slate-400">
                  Parsed from browser request header
                </p>
              )}
            </div>
          </DetailRow>
        )}

        {!info.ip && !info.userAgent && !info.mobile && !info.status && (
          <DetailRow label="Session">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Shield className="h-3 w-3" />
              No connection metadata recorded
            </span>
          </DetailRow>
        )}
      </dl>
    </div>
  );
}
