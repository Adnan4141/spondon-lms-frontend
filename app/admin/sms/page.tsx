'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmsBalancesTab } from '@/features/admin/sms/components/SmsBalancesTab';
import { SmsBulkTab } from '@/features/admin/sms/components/SmsBulkTab';
import { SmsGatewayTab } from '@/features/admin/sms/components/SmsGatewayTab';
import { SmsOverviewTab } from '@/features/admin/sms/components/SmsOverviewTab';
import { SmsReportsTab } from '@/features/admin/sms/components/SmsReportsTab';
import { SmsSystemTab } from '@/features/admin/sms/components/SmsSystemTab';
import { SmsTemplatesTab } from '@/features/admin/sms/components/SmsTemplatesTab';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import {
  useSmsBalancesActions,
  useSmsBulkActions,
  useSmsGatewayActions,
  useSmsManagementData,
  useSmsSystemSettings,
  useSmsTemplateActions,
} from '@/features/admin/sms/hooks/useSmsManagement';
import {
  Metric,
  tabItems,
} from '@/features/admin/sms/sms-shared';

export default function SmsManagementPage() {
  const { user } = useAdminSession();
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const smsData = useSmsManagementData(user);
  const systemSettings = useSmsSystemSettings({
    branches: smsData.branches,
    settings: smsData.settings,
    setSettings: smsData.setSettings,
    submitting: smsData.submitting,
    setSubmitting: smsData.setSubmitting,
    refresh: smsData.loadData,
  });
  const bulkActions = useSmsBulkActions({
    branchBalances: smsData.branchBalances,
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
  const visibleTabs = isBranchAdmin
    ? tabItems.filter((item) => ['overview', 'bulk', 'templates', 'balances', 'reports'].includes(item.value))
    : tabItems;
  const branchBalance = isBranchAdmin ? smsData.branchBalances.find((balance) => balance.branchId === user?.branchId) : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-950">SMS Control Center</h1>
            <p className="truncate text-sm text-slate-500">
              {isBranchAdmin ? 'Branch wallet, bulk SMS, templates, and usage reports' : 'Unified queue, automated policies, bulk SMS, balance, and reports'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={smsData.loadData} disabled={smsData.loading} className="shrink-0 gap-2">
            <RefreshCw className={`h-4 w-4 ${smsData.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-full space-y-4 px-4 py-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label={isBranchAdmin ? 'Branch Balance' : 'Central Balance'} value={isBranchAdmin ? branchBalance?.balanceCount ?? 0 : smsData.orgBalance?.balanceCount ?? '-'} tone="emerald" />
          <Metric label={isBranchAdmin ? 'SMS Rate' : 'Provider Balance'} value={isBranchAdmin ? `৳${smsData.smsPricing.pricePerSms}` : smsData.providerBalanceValue} tone="blue" />
          <Metric label="Queue Pending" value={smsData.queue.summary?.PENDING ?? 0} tone="amber" />
          <Metric label="Sent SMS" value={smsData.sentSmsValue} tone="slate" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
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

          <TabsContent value="overview" className="space-y-4">
            <SmsOverviewTab
              queue={smsData.queue}
              config={smsData.config}
              providerBalanceValue={smsData.providerBalanceValue}
              providerBalanceError={smsData.providerBalanceError}
              failedQueue={smsData.failedQueue}
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <SmsSystemTab
              templates={smsData.templates}
              branches={smsData.branches}
              settingsState={systemSettings.state}
              settingsActions={systemSettings.actions}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <SmsBulkTab
              branches={smsData.branches}
              bulkState={bulkActions.bulkState}
              bulkActions={bulkActions.bulkActions}
              directState={bulkActions.directState}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <SmsTemplatesTab
              templates={smsData.templates}
              templateState={templateActions.state}
              templateActions={templateActions.actions}
            />
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <SmsBalancesTab
              orgBalance={smsData.orgBalance}
              branches={smsData.branches}
              branchBalances={smsData.branchBalances}
              smsTransactions={smsData.smsTransactions}
              balanceState={balanceActions.state}
              balanceActions={balanceActions.actions}
              isBranchAdmin={isBranchAdmin}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <SmsReportsTab
              monthlyRows={smsData.monthlyRows}
              typeReport={smsData.typeReport}
              branchReport={smsData.branchReport}
              programReport={smsData.programReport}
              batchReport={smsData.batchReport}
              dueReport={smsData.dueReport}
              paymentReport={smsData.paymentReport}
              resultReport={smsData.resultReport}
              logs={smsData.logs}
              branches={smsData.branches}
            />
          </TabsContent>

          {!isBranchAdmin && <TabsContent value="gateway" className="space-y-4">
            <SmsGatewayTab
              gatewayState={gatewayActions.state}
              gatewayActions={gatewayActions.actions}
            />
          </TabsContent>}
        </Tabs>
      </div>
    </main>
  );
}
