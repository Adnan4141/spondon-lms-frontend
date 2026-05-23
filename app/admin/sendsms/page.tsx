'use client';

import { RefreshCw } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { SmsSendWorkspace } from '@/features/admin/sms/components/SmsSendWorkspace';
import { useSmsBulkActions, useSmsManagementData } from '@/features/admin/sms/hooks/useSmsManagement';
import { formatRemainingBdt, Metric, SmsWarningBanner } from '@/features/admin/sms/sms-shared';
import { useAdminSession } from '@/features/admin/shared/admin-session';

export default function SendSmsPage() {
  const { user } = useAdminSession();
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const smsData = useSmsManagementData(user);
  const bulkActions = useSmsBulkActions({
    branchBalances: smsData.branchBalances,
    submitting: smsData.submitting,
    setSubmitting: smsData.setSubmitting,
    refresh: smsData.loadData,
    actor: user,
  });
  const branchBalance = isBranchAdmin
    ? smsData.branchBalances.find((balance) => balance.branchId === user?.branchId)
    : undefined;
  const remainingCreditValue = isBranchAdmin
    ? formatRemainingBdt(branchBalance?.balanceCount)
    : smsData.providerBalanceValue;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-950">Send SMS</h1>
            <p className="truncate text-sm text-slate-500">Send student, bulk, manual, or direct SMS</p>
          </div>
          <Button variant="outline" size="sm" onClick={smsData.loadData} disabled={smsData.loading} className="shrink-0 gap-2">
            <RefreshCw className={`h-4 w-4 ${smsData.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-full space-y-4 px-4 py-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Remaining credit" value={remainingCreditValue} tone="emerald" />
          <Metric label="Queue Pending" value={smsData.queue.summary?.QUEUED ?? smsData.queue.summary?.PENDING ?? 0} tone="amber" />
          <Metric label="Sent SMS" value={smsData.sentSmsValue} tone="slate" />
        </div>

        {smsData.queueError ? (
          <SmsWarningBanner title="SMS queue status unavailable">{smsData.queueError}</SmsWarningBanner>
        ) : null}
        {!isBranchAdmin && smsData.providerBalanceError ? (
          <SmsWarningBanner title={smsData.providerBalanceValue === 'Gateway not configured' ? 'Gateway not configured' : 'Provider balance unavailable'}>
            {smsData.providerBalanceError}
          </SmsWarningBanner>
        ) : null}

        <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading SMS workspace...</div>}>
          <SmsSendWorkspace
            branches={smsData.branches}
            bulkState={bulkActions.bulkState}
            bulkActions={bulkActions.bulkActions}
            directState={bulkActions.directState}
            actor={user}
            rates={{
              maskingRate: Number(smsData.config.maskingRate || 0.5),
              nonMaskingRate: Number(smsData.config.nonMaskingRate || 0.35),
            }}
            templates={smsData.templates}
            orgBalance={smsData.orgBalance}
            branchBalances={smsData.branchBalances}
            onSuccess={smsData.loadData}
            sendBlockedMessage={smsData.providerBalanceValue === 'Gateway not configured' ? smsData.providerBalanceError : undefined}
          />
        </Suspense>
      </div>
    </main>
  );
}
