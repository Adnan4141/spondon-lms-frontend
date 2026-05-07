'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAccounts, type Account } from '@/lib/api/accounting';
import type { ExportFormat } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { AccountEditDialog } from './accounts/AccountEditDialog';
import { AccountsTabToolbar } from './accounts/AccountsTabToolbar';
import { AccountsTable } from './accounts/AccountsTable';
import { accountsExportColumns } from './accounts/accountsExport';
import { exportFilename, runExport } from './utils';

export function AccountsTab({
  onAccountsChange,
}: {
  onAccountsChange: (accounts: Account[]) => void;
}) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccounts({ type: typeFilter || undefined });
      if (res.success) {
        setAccounts(res.data);
        onAccountsChange(res.data);
      }
    } catch {
      toast({ title: 'Failed to load accounts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [onAccountsChange, toast, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport(format: ExportFormat) {
    if (accounts.length === 0) {
      toast({ title: 'No accounts to export', variant: 'destructive' });
      return;
    }
    await runExport({
      format,
      filename: exportFilename('chart-of-accounts'),
      sheetName: 'Accounts',
      rows: accounts,
      columns: accountsExportColumns(),
    });
  }

  return (
    <div className="space-y-5">
      <AccountsTabToolbar
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        loading={loading}
        onRefresh={() => void load()}
        exportDisabled={accounts.length === 0 || loading}
        onExport={handleExport}
        onAddAccount={() => {
          setEditingAccount(null);
          setFormOpen(true);
        }}
      />

      <AccountsTable
        loading={loading}
        accounts={accounts}
        onEdit={(account) => {
          setEditingAccount(account);
          setFormOpen(true);
        }}
      />

      <AccountEditDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingAccount={editingAccount}
        onSaved={() => load()}
      />
    </div>
  );
}
