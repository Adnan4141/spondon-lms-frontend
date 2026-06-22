'use client';

import { useMemo } from 'react';
import type { DueSummaryStudentRow } from '@/lib/api/reports';
import { type SmsBalance, type SmsConfig, type SmsTemplate } from '@/lib/api/sms';
import { Badge } from '@/components/ui/badge';
import { SmsFocusDrawerShell } from '@/features/admin/sms/components/SmsFocusDrawerShell';
import { SmsSendWorkspace } from '@/features/admin/sms/components/SmsSendWorkspace';
import { CANONICAL_DUE_REMINDER_MESSAGE } from '@/features/admin/sms/sms-shared';
import {
  buildDueReminderCampaignName,
  buildDueReminderDraftKey,
  detectMixedBranches,
} from '@/features/admin/sms/components/due-reminder/due-reminder-utils';
import type { BranchOption } from '../shared';
import { fmtCur, fmtNum } from '../shared';

type DueReminderActor = {
  role?: string | null;
  branchId?: string | null;
};

export type DueReminderDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: DueSummaryStudentRow[];
  branches: BranchOption[];
  actor?: DueReminderActor;
  month?: string;
  branchLabel?: string;
  filterBranchId?: string;
  config?: Partial<SmsConfig>;
  templates?: SmsTemplate[];
  orgBalance?: SmsBalance | null;
  branchBalances?: SmsBalance[];
  sendBlockedMessage?: string;
  onSuccess?: () => void;
};

function dueMonthLabel(month?: string) {
  return month || new Date().toISOString().slice(0, 7);
}

export function DueReminderDrawer({
  open,
  onOpenChange,
  rows,
  branches,
  actor,
  month,
  branchLabel,
  filterBranchId,
  config,
  templates,
  orgBalance,
  branchBalances,
  sendBlockedMessage,
  onSuccess,
}: DueReminderDrawerProps) {
  const billingMonth = dueMonthLabel(month);
  const totalDue = rows.reduce((sum, row) => sum + row.totalDue, 0);
  const maskingRate = Number(config?.maskingRate ?? 0.5);
  const nonMaskingRate = Number(config?.nonMaskingRate ?? 0.35);
  const resolvedBranchId = actor?.role === 'BRANCH_ADMIN'
    ? actor.branchId || undefined
    : rows[0]?.branchId || filterBranchId || undefined;

  const recipients = useMemo(
    () => rows.map((row) => ({
      id: row.studentUserId,
      name: row.fullName,
      phone: row.mobile,
      branchId: row.branchId,
      variables: {
        name: row.fullName,
        phone: row.mobile,
        amount: fmtNum(row.totalDue),
        month: month || 'current month',
        program: row.programSummary || 'your program',
        course: row.courseSummary || 'course fees',
        due_date: row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString('en-GB') : 'the due date',
      },
    })),
    [month, rows],
  );

  const draftStorageKey = buildDueReminderDraftKey({
    month: billingMonth,
    branchId: filterBranchId || resolvedBranchId,
  });
  const defaultCampaignName = buildDueReminderCampaignName({
    month: billingMonth,
    branchLabel,
  });
  const isMixedBranch = !filterBranchId && detectMixedBranches(recipients);

  const focusedConfig = useMemo(() => ({
    method: 'students' as const,
    locked: true,
    stepped: true,
    contextLabel: 'Due Reminder',
    templateKey: 'DUE_REMINDER',
    defaultMessage: CANONICAL_DUE_REMINDER_MESSAGE,
    context: 'due_reminder',
    type: 'DUE_REMINDER',
    source: 'DIRECT',
    scope: 'BRANCH' as const,
    branchId: resolvedBranchId,
    allowSchedule: true,
    recipientVariant: 'due' as const,
    draftStorageKey,
    defaultCampaignName,
    recipients,
  }), [defaultCampaignName, draftStorageKey, recipients, resolvedBranchId]);

  return (
    <SmsFocusDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Due Reminder"
      description={
        <>
          {fmtNum(rows.length)} student{rows.length === 1 ? '' : 's'} · {fmtCur(totalDue)} total due
        </>
      }
      meta={
        <>
          {branchLabel ? (
            <Badge variant="outline" className="rounded-full font-semibold">
              {branchLabel}
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-full font-semibold">
            Month: {billingMonth}
          </Badge>
          <Badge variant="outline" className="rounded-full font-semibold text-blue-700">
            {fmtNum(rows.length)} selected
          </Badge>
          {isMixedBranch ? (
            <Badge variant="outline" className="rounded-full font-semibold text-amber-700">
              Mixed branches
            </Badge>
          ) : null}
        </>
      }
      infoBanner={
        <>
          {isMixedBranch ? (
            <>
              <strong>Mixed branches selected.</strong> SMS will use the first student&apos;s branch wallet context.
              {' '}
            </>
          ) : null}
          You can send due reminders as many times as needed for the same month.
          Message drafts are saved locally while this drawer is open.
        </>
      }
    >
      <SmsSendWorkspace
        branches={branches}
        actor={actor}
        rates={{ maskingRate, nonMaskingRate }}
        config={config}
        templates={templates}
        orgBalance={orgBalance}
        branchBalances={branchBalances}
        sendBlockedMessage={sendBlockedMessage}
        queueButtonLabel="Send Due Reminders"
        focused={focusedConfig}
        onSuccess={() => {
          onSuccess?.();
          onOpenChange(false);
        }}
      />
    </SmsFocusDrawerShell>
  );
}
