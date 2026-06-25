'use client';

import { useState } from 'react';
import { Lock, ShieldCheck, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  blockEnrollmentAccess,
  restoreEnrollmentAccess,
  setEnrollmentAccessExempt,
} from '@/lib/api/enrollments';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { promptAction } from '@/features/admin/shared/prompt-action';
import type { Enrollment } from '../types';

type Props = {
  enrollment: Pick<
    Enrollment,
    'id' | 'status' | 'accessStatus' | 'accessHoldExempt' | 'accessBlockedReason'
  >;
  compact?: boolean;
  onUpdated?: () => void | Promise<void>;
  showToast?: (msg: string, type?: string) => void;
};

export function EnrollmentAccessControls({ enrollment, compact, onUpdated, showToast }: Props) {
  const [busy, setBusy] = useState<'block' | 'restore' | 'exempt' | null>(null);
  const hasAccess = enrollment.accessStatus === 'FULL_ACCESS' || enrollment.accessStatus === 'LIMITED_ACCESS';
  const isTerminal = ['CANCELLED', 'COMPLETED'].includes(enrollment.status);

  const runBlock = async () => {
    const reason = await promptAction({
      title: 'Block portal access',
      description: 'Reason for blocking access (min 3 characters).',
      defaultValue: 'Due payment',
      placeholder: 'Reason',
      confirmLabel: 'Continue',
      minLength: 3,
    });
    if (!reason || reason.trim().length < 3) return;
    const confirmed = await confirmAction({
      title: 'Block portal access?',
      description: 'Student will lose course, exam, and book portal access. Billing invoices remain unchanged.',
      confirmLabel: 'Block access',
      variant: 'danger',
    });
    if (!confirmed) return;
    setBusy('block');
    try {
      const res = await blockEnrollmentAccess(enrollment.id, {
        reason: reason.trim(),
        source: 'DUE_PAYMENT',
      });
      if (!res.success) throw new Error(res.message || 'Failed to block access');
      showToast?.('Portal access blocked', 'success');
      await onUpdated?.();
    } catch (error) {
      showToast?.((error as Error).message || 'Failed to block access', 'error');
    } finally {
      setBusy(null);
    }
  };

  const runRestore = async () => {
    const confirmed = await confirmAction({
      title: 'Restore portal access?',
      description: 'Student will regain portal access for this enrollment.',
      confirmLabel: 'Restore access',
    });
    if (!confirmed) return;
    setBusy('restore');
    try {
      const res = await restoreEnrollmentAccess(enrollment.id, {
        reason: 'Access restored by admin',
      });
      if (!res.success) throw new Error(res.message || 'Failed to restore access');
      showToast?.('Portal access restored', 'success');
      await onUpdated?.();
    } catch (error) {
      showToast?.((error as Error).message || 'Failed to restore access', 'error');
    } finally {
      setBusy(null);
    }
  };

  const runExemptToggle = async () => {
    const next = !enrollment.accessHoldExempt;
    const reason = await promptAction({
      title: next ? 'Exempt from due blocks' : 'Remove exempt flag',
      description: next
        ? 'Reason for exempting from bulk due blocks (min 3 characters).'
        : 'Reason for removing exempt flag (min 3 characters).',
      defaultValue: next ? 'Admin approved continued access despite due' : 'Exempt removed',
      placeholder: 'Reason',
      confirmLabel: 'Save',
      minLength: 3,
    });
    if (!reason || reason.trim().length < 3) return;
    setBusy('exempt');
    try {
      const res = await setEnrollmentAccessExempt(enrollment.id, { exempt: next, reason: reason.trim() });
      if (!res.success) throw new Error(res.message || 'Failed to update exempt flag');
      showToast?.(next ? 'Enrollment marked exempt' : 'Exempt flag removed', 'success');
      await onUpdated?.();
    } catch (error) {
      showToast?.((error as Error).message || 'Failed to update exempt flag', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (isTerminal) return null;

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-wrap items-center gap-2'}>
      {hasAccess ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void runBlock()}
          className="gap-1.5 border-amber-200 text-amber-800 hover:bg-amber-50"
        >
          <Lock className="h-3.5 w-3.5" />
          {busy === 'block' ? 'Blocking…' : 'Block Access'}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void runRestore()}
          className="gap-1.5 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        >
          <Unlock className="h-3.5 w-3.5" />
          {busy === 'restore' ? 'Restoring…' : 'Restore Access'}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => void runExemptToggle()}
        className={
          enrollment.accessHoldExempt
            ? 'gap-1.5 border-violet-200 bg-violet-50 text-violet-800'
            : 'gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50'
        }
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {busy === 'exempt' ? 'Saving…' : enrollment.accessHoldExempt ? 'Exempt: ON' : 'Allow Despite Due'}
      </Button>
    </div>
  );
}
