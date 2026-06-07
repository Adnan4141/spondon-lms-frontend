'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAccountingSummary, type AccountingSummary } from '@/lib/api/accounting';
import type { ExportFormat } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { SummaryAccountBalancesTable } from './summary/SummaryAccountBalancesTable';
import { SummaryBreakdownPanel } from './summary/SummaryBreakdownPanel';
import { SummaryByTypePanel } from './summary/SummaryByTypePanel';
import { SummaryKpiCards } from './summary/SummaryKpiCards';
import { SummaryTabEmpty } from './summary/SummaryTabEmpty';
import { SummaryTabFilters } from './summary/SummaryTabFilters';
import { summaryExportColumns } from './summary/summaryExport';
import { exportFilename, runExport } from './utils';

export function SummaryTab() {
  const { toast } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountingSummary({ from: from || undefined, to: to || undefined });
      if (res.success) setSummary(res.data);
    } catch {
      toast({ title: 'Failed to load summary', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [from, to, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport(format: ExportFormat) {
    if (!summary) {
      toast({ title: 'Load summary first', variant: 'destructive' });
      return;
    }
    await runExport({
      format,
      filename: exportFilename('accounting-summary'),
      sheetName: 'Summary',
      rows: summary.recentAccountBalances,
      columns: summaryExportColumns(),
    });
  }

  return (
    <div className="space-y-5">
      <SummaryTabFilters
        from={from}
        onFromChange={setFrom}
        to={to}
        onToChange={setTo}
        loading={loading}
        onRefresh={() => void load()}
        exportDisabled={!summary || loading}
        onExport={handleExport}
      />

      {summary ? (
        <>
          <SummaryKpiCards summary={summary} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
            <SummaryByTypePanel byType={summary.byType} totalAccounts={summary.totalAccounts} />
            <SummaryAccountBalancesTable rows={summary.recentAccountBalances} />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SummaryBreakdownPanel
              title="Branch & Source Summary"
              rows={summary.bySource || []}
              highlightBranchLinked
            />
            <SummaryBreakdownPanel title="Purpose Summary" rows={summary.byPurpose || []} />
          </div>
        </>
      ) : !loading ? (
        <SummaryTabEmpty />
      ) : null}
    </div>
  );
}
