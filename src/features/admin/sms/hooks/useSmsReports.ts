'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Branch } from '@/lib/api/branches';
import {
  getSmsLogStats,
  getSmsReportBatch,
  getSmsReportBranch,
  getSmsReportDue,
  getSmsReportPayment,
  getSmsReportProgram,
  getSmsReportResult,
  getSmsReportSummary,
  getSmsReportType,
  type SmsLog,
  type SmsLogStats,
  type SmsReportRow,
} from '@/lib/api/sms';
import { errorMessage } from '../sms-shared';

export type SmsReportFilters = {
  from: string;
  to: string;
  branchId: string;
  paymentSource: string;
};

type SmsReportsActor = { role?: string | null; branchId?: string | null };

function reportQueryParams(filters: SmsReportFilters, actor?: SmsReportsActor) {
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';
  const branchId = isBranchAdmin ? actor?.branchId || undefined : filters.branchId || undefined;
  return {
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(branchId ? { branchId } : {}),
  };
}

export function useSmsReports(branches: Branch[], actor?: SmsReportsActor) {
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SmsReportFilters>({
    from: '',
    to: '',
    branchId: '',
    paymentSource: '',
  });
  const [monthlyRows, setMonthlyRows] = useState<Array<{ month: string; successCount: number; failedCount: number; recipientCount: number }>>([]);
  const [typeReport, setTypeReport] = useState<SmsReportRow[]>([]);
  const [branchReport, setBranchReport] = useState<SmsReportRow[]>([]);
  const [programReport, setProgramReport] = useState<SmsReportRow[]>([]);
  const [batchReport, setBatchReport] = useState<SmsReportRow[]>([]);
  const [dueReport, setDueReport] = useState<SmsLog[]>([]);
  const [paymentReport, setPaymentReport] = useState<SmsLog[]>([]);
  const [resultReport, setResultReport] = useState<SmsLog[]>([]);
  const [stats, setStats] = useState<SmsLogStats | null>(null);
  const [loadError, setLoadError] = useState('');

  const queryParams = useMemo(() => reportQueryParams(filters, actor), [actor, filters]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [
        summaryRes,
        typeRes,
        branchUsageRes,
        programUsageRes,
        batchUsageRes,
        dueRes,
        paymentRes,
        resultRes,
        statsRes,
      ] = await Promise.all([
        getSmsReportSummary(queryParams),
        getSmsReportType(queryParams),
        getSmsReportBranch(queryParams),
        getSmsReportProgram(queryParams),
        getSmsReportBatch(queryParams),
        getSmsReportDue({ ...queryParams, limit: 20 }),
        getSmsReportPayment({
          ...queryParams,
          limit: 20,
          ...(filters.paymentSource ? { source: filters.paymentSource } : {}),
        }),
        getSmsReportResult({ ...queryParams, limit: 20 }),
        getSmsLogStats(queryParams),
      ]);

      if (summaryRes.success) {
        const monthly = Array.isArray(summaryRes.data?.monthly)
          ? summaryRes.data.monthly as Array<{ month: string; successCount: number; failedCount: number; recipientCount: number }>
          : [];
        setMonthlyRows(monthly);
      }
      if (typeRes.success) setTypeReport(typeRes.data || []);
      if (branchUsageRes.success) setBranchReport(branchUsageRes.data || []);
      if (programUsageRes.success) setProgramReport(programUsageRes.data || []);
      if (batchUsageRes.success) setBatchReport(batchUsageRes.data || []);
      if (dueRes.success) setDueReport(dueRes.data || []);
      if (paymentRes.success) setPaymentReport(paymentRes.data || []);
      if (resultRes.success) setResultReport(resultRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch (error: unknown) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters.paymentSource, queryParams]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const setPaymentSourceFilter = useCallback((paymentSource: string) => {
    setFilters((prev) => ({ ...prev, paymentSource }));
  }, []);

  const updateFilters = useCallback((patch: Partial<SmsReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const visibleBranches = isBranchAdmin && actor?.branchId
    ? branches.filter((branch) => branch.id === actor.branchId)
    : branches;

  return {
    loading,
    loadError,
    filters,
    updateFilters,
    setPaymentSourceFilter,
    loadReports,
    monthlyRows,
    typeReport,
    branchReport,
    programReport,
    batchReport,
    dueReport,
    paymentReport,
    resultReport,
    stats,
    branches: visibleBranches,
    isBranchAdmin,
  };
}
