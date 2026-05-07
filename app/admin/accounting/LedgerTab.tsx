'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteLedgerEntry, getLedgerEntries, type Account, type LedgerEntry } from '@/lib/api/accounting';
import type { DistributionChannel, StockSource } from '@/lib/api/books';
import type { ExportFormat } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { exportFilename, runExport } from './utils';
import { LedgerEntriesTable } from './ledger/LedgerEntriesTable';
import { ledgerExportColumns } from './ledger/ledgerExport';
import { LedgerEditEntryDialog } from './ledger/LedgerEditEntryDialog';
import { LedgerNewEntryDialog } from './ledger/LedgerNewEntryDialog';
import { LedgerTabFilters } from './ledger/LedgerTabFilters';
import { LedgerTabPagination } from './ledger/LedgerTabPagination';
import { LedgerTabStats } from './ledger/LedgerTabStats';

export function LedgerTab({
  accounts,
  stockSources,
  channels,
}: {
  accounts: Account[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
}) {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState('');
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
  const [editEntry, setEditEntry] = useState<LedgerEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const LIMIT = 50;

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await getLedgerEntries({
        accountId: accountId || undefined,
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
  }, [accountId, flowType, from, sourceType, to, toast]);

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
  const sourceCount = stockSources.length + channels.length;

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

  async function handleDelete(entry: LedgerEntry) {
    if (!window.confirm(`Delete daily entry ${entry.voucherNo || entry.id}? This removes the entry and any linked transfer row.`)) return;
    setDeletingId(entry.id);
    try {
      const res = await deleteLedgerEntry(entry.id);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      toast({ title: 'Daily entry deleted', variant: 'success' });
      await load(page);
    } catch (error) {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <LedgerTabFilters
        accounts={accounts}
        accountId={accountId}
        onAccountIdChange={setAccountId}
        flowType={flowType}
        onFlowTypeChange={setFlowType}
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

      <LedgerEntriesTable
        loading={loading}
        entries={entries}
        onEdit={setEditEntry}
        onDelete={(entry) => void handleDelete(entry)}
        deletingId={deletingId}
      />

      <LedgerNewEntryDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        stockSources={stockSources}
        channels={channels}
        onEntryCreated={() => load(1)}
      />

      <LedgerEditEntryDialog
        entry={editEntry}
        accounts={accounts}
        stockSources={stockSources}
        channels={channels}
        onClose={() => setEditEntry(null)}
        onEntryUpdated={() => load(page)}
      />
    </div>
  );
}
