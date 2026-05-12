'use client';

import { useEffect, useState } from 'react';
import { getAccounts, type Account } from '@/lib/api/accounting';
import { getBranches, type Branch } from '@/lib/api/branches';
import {
  getDistributionChannels,
  getStockSources,
  type DistributionChannel,
  type StockSource,
} from '@/lib/api/books';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Wallet } from 'lucide-react';
import { AccountsTab } from './AccountsTab';
import { LedgerTab } from './LedgerTab';
import { SummaryTab } from './SummaryTab';
import { TABS } from './constants';
import type { TabKey } from './types';

export default function AdminAccountingPage() {
  const { toast, toasts, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stockSources, setStockSources] = useState<StockSource[]>([]);
  const [channels, setChannels] = useState<DistributionChannel[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setMetaLoading(true);
      try {
        const [accountRes, branchRes, sourceRes, channelRes] = await Promise.all([
          getAccounts(),
          getBranches(),
          getStockSources({ includeInactive: true }),
          getDistributionChannels({ includeInactive: true }),
        ]);
        if (accountRes.success) setAccounts(accountRes.data);
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        if (sourceRes.success && sourceRes.data) setStockSources(sourceRes.data);
        if (channelRes.success && channelRes.data) setChannels(channelRes.data);
      } catch {
        toast({ title: 'Failed to load data', variant: 'destructive' });
      } finally {
        setMetaLoading(false);
      }
    }
    void load();
  }, [toast]);

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Accounting</h1>
          <p className="text-sm font-medium text-slate-500">Head office money tracking for cash, bank, and bKash accounts</p>
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
                activeTab === tab.key ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {metaLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      ) : (
        <div>
          {activeTab === 'summary' ? <SummaryTab /> : null}
          {activeTab === 'ledger' ? <LedgerTab accounts={accounts} branches={branches} stockSources={stockSources} channels={channels} /> : null}
          {activeTab === 'accounts' ? <AccountsTab onAccountsChange={setAccounts} /> : null}
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
