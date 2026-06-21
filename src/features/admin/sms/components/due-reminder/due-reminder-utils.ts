'use client';

import { isValidBdMobile } from '@/features/admin/students/studentValidation';
import type { SmsRecipient } from '@/lib/api/sms';
import { recipientKey } from '../send-workspace/utils';

export type DueReminderDraft = {
  message: string;
  smsType: 'masking' | 'non_masking';
  scheduledAt?: string;
  savedAt: string;
};

const DRAFT_PREFIX = 'due-reminder-draft:';

export function buildDueReminderCampaignName(args: {
  month: string;
  branchLabel?: string;
}) {
  const branch = args.branchLabel && args.branchLabel !== 'All Branches' ? args.branchLabel : 'All Branches';
  return `Due Reminder — ${args.month} — ${branch}`;
}

export function buildDueReminderDraftKey(args: {
  month: string;
  branchId?: string;
}) {
  return `${DRAFT_PREFIX}${args.month}:${args.branchId || 'all'}`;
}

export function loadDueReminderDraft(storageKey: string): DueReminderDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DueReminderDraft;
    if (!parsed?.message || typeof parsed.message !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDueReminderDraft(storageKey: string, draft: Omit<DueReminderDraft, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify({
      ...draft,
      savedAt: new Date().toISOString(),
    } satisfies DueReminderDraft));
  } catch {
    // ignore quota errors
  }
}

export function clearDueReminderDraft(storageKey: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

export function recipientHasInvalidMobile(recipient: SmsRecipient) {
  return !isValidBdMobile(String(recipient.phone || ''));
}

export function getRecipientStableKey(recipient: SmsRecipient, index: number) {
  return recipientKey(recipient, index);
}

export function detectMixedBranches(recipients: SmsRecipient[]) {
  const branchIds = new Set(recipients.map((recipient) => recipient.branchId).filter(Boolean));
  return branchIds.size > 1;
}

export const DUE_RECIPIENT_ROW_HEIGHT = 72;
