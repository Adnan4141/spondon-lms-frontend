'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SmsRecipient } from '@/lib/api/sms';
import { SmsSendWorkspace } from './SmsSendWorkspace';

export function SmsSendDrawer({
  open,
  onOpenChange,
  recipients,
  templateKey,
  defaultMessage,
  defaultVars = {},
  contextLabel,
  context = 'manual',
  branchId,
  scope = branchId ? 'BRANCH' : 'ORG',
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: SmsRecipient[];
  templateKey?: string;
  defaultMessage?: string;
  defaultVars?: Record<string, unknown>;
  contextLabel: string;
  context?: string;
  branchId?: string;
  scope?: 'ORG' | 'BRANCH';
  onSuccess?: () => void;
}) {
  if (!open) return null;

  const maskingRate = Number(defaultVars.maskingRate || 0.5);
  const nonMaskingRate = Number(defaultVars.nonMaskingRate || 0.35);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        aria-label="Close SMS drawer"
        onClick={() => onOpenChange(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-6xl overflow-y-auto bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-blue-600">Focused SMS Workspace</p>
            <h2 className="truncate text-lg font-bold text-slate-950">{contextLabel}</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">
          <SmsSendWorkspace
            branches={[]}
            rates={{ maskingRate, nonMaskingRate }}
            focused={{
              method: 'students',
              locked: true,
              contextLabel,
              templateKey,
              defaultMessage,
              context,
              type: context.toUpperCase(),
              source: context === 'manual' ? 'DIRECT' : 'SYSTEM',
              scope,
              branchId,
              allowSchedule: context !== 'direct',
              recipients,
              metadata: { defaultVars },
            }}
            onSuccess={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
          />
        </div>
      </aside>
    </div>
  );
}
