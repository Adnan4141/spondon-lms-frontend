'use client';

import type { SmsBalance, SmsConfig, SmsRecipient, SmsTemplate } from '@/lib/api/sms';
import { SmsFocusDrawerShell } from './SmsFocusDrawerShell';
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
  config,
  templates,
  orgBalance,
  branchBalances,
  sendBlockedMessage,
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
  config?: Partial<SmsConfig>;
  templates?: SmsTemplate[];
  orgBalance?: SmsBalance | null;
  branchBalances?: SmsBalance[];
  sendBlockedMessage?: string;
  onSuccess?: () => void;
}) {
  const maskingRate = Number(defaultVars.maskingRate ?? config?.maskingRate ?? 0.6);
  const nonMaskingRate = Number(defaultVars.nonMaskingRate ?? config?.nonMaskingRate ?? 0.35);

  return (
    <SmsFocusDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={contextLabel}
      description={`${recipients.length.toLocaleString()} recipient${recipients.length === 1 ? '' : 's'} selected`}
    >
      <SmsSendWorkspace
        branches={[]}
        rates={{ maskingRate, nonMaskingRate }}
        config={config}
        templates={templates}
        orgBalance={orgBalance}
        branchBalances={branchBalances}
        sendBlockedMessage={sendBlockedMessage}
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
    </SmsFocusDrawerShell>
  );
}
