'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmsBalancesTab } from '@/features/admin/sms/components/SmsBalancesTab';
import { SmsGatewayTab } from '@/features/admin/sms/components/SmsGatewayTab';
import { SmsOverviewTab } from '@/features/admin/sms/components/SmsOverviewTab';
import { SmsReportsTab } from '@/features/admin/sms/components/SmsReportsTab';
import { SmsSystemTab } from '@/features/admin/sms/components/SmsSystemTab';
import { SmsTemplatesTab } from '@/features/admin/sms/components/SmsTemplatesTab';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { hasPermission } from '@/features/admin/shared/permissions';
import {
  useSmsBalancesActions,
  useSmsGatewayActions,
  useSmsManagementData,
  useSmsSystemSettings,
  useSmsTemplateActions,
} from '@/features/admin/sms/hooks/useSmsManagement';
import { formatRemainingBdt, Metric, SmsWarningBanner, tabItems } from '@/features/admin/sms/sms-shared';
import { SmsLogsTab } from '@/features/admin/sms/components/SmsLogsTab';

export default function SmsManagementPage() {
  const { user } = useAdminSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const smsData = useSmsManagementData(user);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'logs');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['templates', 'gateway', 'logs', 'reports'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sendTabs = new Set(['send', 'students', 'bulk', 'manual', 'direct']);
    const tab = searchParams.get('tab');
    if (!tab) return;

    if (sendTabs.has(tab)) {
      const next = new URLSearchParams(searchParams.toString());
      if (tab === 'send') next.set('tab', 'students');
      router.replace(`/admin/sendsms?${next.toString()}`);
      return;
    }
  }, [router]);

  const systemSettings = useSmsSystemSettings({
    branches: smsData.branches,
    settings: smsData.settings,
    setSettings: smsData.setSettings,
    submitting: smsData.submitting,
    setSubmitting: smsData.setSubmitting,
    refresh: smsData.loadData,
    actor: user,
  });
  const balanceActions = useSmsBalancesActions({
    smsPricing: smsData.smsPricing,
    submitting: smsData.submitting,
    setSubmitting: smsData.setSubmitting,
    refresh: smsData.loadData,
    actor: user,
  });
  const templateActions = useSmsTemplateActions({
    templates: smsData.templates,
    submitting: smsData.submitting,
    setSubmitting: smsData.setSubmitting,
    refresh: smsData.loadData,
  });
  const gatewayActions = useSmsGatewayActions({
    config: smsData.config,
    setConfig: smsData.setConfig,
    providerBalanceValue: smsData.providerBalanceValue,
    providerBalanceError: smsData.providerBalanceError,
    submitting: smsData.submitting,
    setSubmitting: smsData.setSubmitting,
    refresh: smsData.loadData,
  });
  const gatewaySubTabs = isBranchAdmin
    ? [{ value: 'balances' as const, label: 'Wallet' }]
    : [
        { value: 'overview' as const, label: 'Overview' },
        { value: 'gateway' as const, label: 'Gateway' },
        { value: 'policies' as const, label: 'Policies' },
        { value: 'balances' as const, label: 'Balances' },
      ];

  const visibleTabs = isBranchAdmin
    ? tabItems.filter((item) => ['logs', 'reports', 'gateway'].includes(item.value))
    : tabItems.filter((item) => item.value !== 'templates' || hasPermission(user?.role, 'sms:templates:manage'));

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
            <h1 className="truncate text-xl font-bold text-slate-950">SMS Control Center</h1>
            <p className="truncate text-sm text-slate-500">
              {isBranchAdmin ? 'Monitor branch SMS history and review usage reports' : 'Manage templates, configure rates, and monitor delivery'}
            </p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="flex h-auto w-max min-w-full justify-start gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:w-full sm:flex-wrap">
              {visibleTabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="h-9 flex-none gap-2 px-3 text-xs sm:flex-1 sm:text-sm">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {!isBranchAdmin && (
            <TabsContent value="templates" className="space-y-4">
              <SmsTemplatesTab
                templates={smsData.templates}
                templateState={templateActions.state}
                templateActions={templateActions.actions}
              />
            </TabsContent>
          )}

          <TabsContent value="gateway" className="space-y-4">
            <Tabs defaultValue={isBranchAdmin ? 'balances' : 'overview'} className="space-y-4">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-slate-200 bg-white p-1">
                {gatewaySubTabs.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value} className="flex-1 px-3 text-xs sm:text-sm">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {!isBranchAdmin && (
                <>
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <SmsOverviewTab
                      queue={smsData.queue}
                      config={smsData.config}
                      providerBalanceValue={smsData.providerBalanceValue}
                      providerBalanceError={smsData.providerBalanceError}
                      failedQueue={smsData.failedQueue}
                    />
                  </TabsContent>

                  <TabsContent value="gateway" className="mt-0 space-y-4">
                    <SmsGatewayTab gatewayState={gatewayActions.state} gatewayActions={gatewayActions.actions} />
                  </TabsContent>

                  <TabsContent value="policies" className="mt-0 space-y-4">
                    <SmsSystemTab
                      templates={smsData.templates}
                      branches={smsData.branches}
                      settingsState={systemSettings.state}
                      settingsActions={systemSettings.actions}
                    />
                  </TabsContent>
                </>
              )}

              <TabsContent value="balances" className="mt-0 space-y-4">
                <SmsBalancesTab
                  orgBalance={smsData.orgBalance}
                  branches={smsData.branches}
                  branchBalances={smsData.branchBalances}
                  walletLedger={smsData.walletLedger}
                  smsTransactions={smsData.smsTransactions}
                  balanceState={balanceActions.state}
                  balanceActions={balanceActions.actions}
                  providerBalanceValue={smsData.providerBalanceValue}
                  isBranchAdmin={isBranchAdmin}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <SmsLogsTab
              branches={smsData.branches}
              actor={user}
              initialFilters={{
                from: searchParams.get('from') || '',
                to: searchParams.get('to') || '',
                type: searchParams.get('type') || 'ALL',
                branchId: searchParams.get('branchId') || '',
              }}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <SmsReportsTab branches={smsData.branches} actor={user} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
