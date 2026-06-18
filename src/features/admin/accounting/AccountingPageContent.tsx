'use client';

import { useEffect, useState } from 'react';
import { useAccountingMeta } from '@/lib/query/hooks/useAccountingMeta';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Wallet } from 'lucide-react';
import type { Account } from '@/lib/api/accounting';
import { AccountsTab } from './AccountsTab';
import { LedgerTab } from './LedgerTab';
import { SummaryTab } from './SummaryTab';
import { TABS } from './constants';
import type { TabKey } from './types';

export function AccountingPageContent() {
  const { toast, toasts, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const { data, isLoading, isError } = useAccountingMeta();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (data?.accounts) setAccounts(data.accounts);
  }, [data?.accounts]);

  useEffect(() => {
    if (isError) {
      toast({ title: 'Failed to load data', variant: 'destructive' });
    }
  }, [isError, toast]);

  const branches = data?.branches ?? [];
  const stockSources = data?.stockSources ?? [];
  const channels = data?.channels ?? [];

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Accounting</h1>
          <p className="text-sm font-medium text-slate-500">
            Head office Cash, Bank, and bKash — branch source tags the related counterparty only
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === tab.key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      ) : (
        <div>
          {activeTab === 'summary' ? <SummaryTab /> : null}
          {activeTab === 'ledger' ? (
            <LedgerTab
              accounts={accounts}
              branches={branches}
              stockSources={stockSources}
              channels={channels}
            />
          ) : null}
          {activeTab === 'accounts' ? <AccountsTab onAccountsChange={setAccounts} /> : null}
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
