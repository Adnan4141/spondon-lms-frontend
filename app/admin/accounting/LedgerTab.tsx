'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLedgerEntries, type Account, type LedgerEntry } from '@/lib/api/accounting';
import type { Branch } from '@/lib/api/branches';
import type { DistributionChannel, StockSource } from '@/lib/api/books';
import type { ExportFormat } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { exportFilename, runExport } from './utils';
import { LedgerEntriesTable } from './ledger/LedgerEntriesTable';
import { ledgerExportColumns } from './ledger/ledgerExport';
import { LedgerNewEntryDialog } from './ledger/LedgerNewEntryDialog';
import { LedgerTabFilters } from './ledger/LedgerTabFilters';
import { LedgerTabPagination } from './ledger/LedgerTabPagination';
import { LedgerTabStats } from './ledger/LedgerTabStats';

export function LedgerTab({
  accounts,
  branches,
  stockSources,
  channels,
}: {
  accounts: Account[];
  branches: Branch[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
}) {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [flowType, setFlowType] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const LIMIT = 50;

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await getLedgerEntries({
        accountId: accountId || undefined,
        branchId: branchId || undefined,
        from: from || undefined,
        to: to || undefined,
        entryType: flowType || undefined,
        sourceType: sourceType || undefined,
        page: pg,
        limit: LIMIT,
      });
      if (res.success) {
        setEntries(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(pg);
      }
    } catch {
      toast({ title: 'Failed to load ledger', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accountId, branchId, flowType, from, sourceType, to, toast]);

  useEffect(() => {
    void load(1);
  }, [load]);

  const debitRowCount = useMemo(
    () => entries.filter((entry) => entry.entryType === 'EXPENSE').length,
    [entries],
  );
  const creditRowCount = useMemo(
    () => entries.filter((entry) => entry.entryType === 'INCOME').length,
    [entries],
  );
  const sourceCount = stockSources.length + channels.length + branches.length;

  async function handleExport(format: ExportFormat) {
    if (entries.length === 0) {
      toast({ title: 'No daily entries to export', variant: 'destructive' });
      return;
    }
    await runExport({
      format,
      filename: exportFilename('daily-entries'),
      sheetName: 'Daily Entries',
      rows: entries,
      columns: ledgerExportColumns(),
    });
  }

  return (
    <div className="space-y-5">
      <LedgerTabFilters
        accounts={accounts}
        branches={branches}
        accountId={accountId}
        onAccountIdChange={setAccountId}
        flowType={flowType}
        onFlowTypeChange={setFlowType}
        branchId={branchId}
        onBranchIdChange={setBranchId}
        sourceType={sourceType}
        onSourceTypeChange={setSourceType}
        from={from}
        onFromChange={setFrom}
        to={to}
        onToChange={setTo}
        loading={loading}
        onSearch={() => void load(1)}
        exportDisabled={entries.length === 0 || loading}
        onExport={handleExport}
        onNewEntry={() => setFormOpen(true)}
      />

      <LedgerTabStats
        total={total}
        debitRowCount={debitRowCount}
        creditRowCount={creditRowCount}
        sourceCount={sourceCount}
        page={page}
        totalPages={totalPages}
      />

      <LedgerTabPagination
        total={total}
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPrev={() => void load(page - 1)}
        onNext={() => void load(page + 1)}
      />

      <LedgerEntriesTable loading={loading} entries={entries} />

      <LedgerNewEntryDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        branches={branches}
        stockSources={stockSources}
        channels={channels}
        onEntryCreated={() => load(1)}
      />
    </div>
  );
}
