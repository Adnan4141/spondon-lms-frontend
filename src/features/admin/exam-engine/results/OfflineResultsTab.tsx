'use client';

import { useState } from 'react';
import { Building2, Loader2, MessageSquare, Shield, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  approveResultBatchBranch,
  approveResultBatchCentral,
  deleteResultBatch,
  rejectResultBatch,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import type { BranchOption } from './types';

type OfflineResultsTabProps = {
  examId: string;
  branches: BranchOption[];
  branchId: string;
  examBranchId?: string | null;
  selectedBranchId: string;
  singleRoll: string;
  singleMarks: string;
  singleTotal: string;
  bulkRows: string;
  excelFile: File | null;
  offlineBusy: boolean;
  offlineErrors: Array<Record<string, unknown>>;
  resultBatches: ResultBatchSummary[];
  canEnter: boolean;
  canApproveBranch: boolean;
  canApproveCentral: boolean;
  canReject: boolean;
  canDelete: boolean;
  canSendSms: boolean;
  onBranchIdChange: (branchId: string) => void;
  onSingleRollChange: (value: string) => void;
  onSingleMarksChange: (value: string) => void;
  onSingleTotalChange: (value: string) => void;
  onBulkRowsChange: (value: string) => void;
  onExcelFileChange: (file: File | null) => void;
  onSubmitSingle: () => void;
  onSubmitBulk: () => void;
  onSubmitExcel: () => void;
  onOpenSmsWorkspace: (batch: ResultBatchSummary) => void;
  onBatchUpdated: () => void;
  /** When true, Excel column C is CQ marks merged into existing OMR MCQ results. */
  isCombinedOffline?: boolean;
};

export function OfflineResultsTab({
  examId,
  branches,
  branchId,
  examBranchId,
  selectedBranchId,
  singleRoll,
  singleMarks,
  singleTotal,
  bulkRows,
  excelFile,
  offlineBusy,
  offlineErrors,
  resultBatches,
  canEnter,
  canApproveBranch,
  canApproveCentral,
  canReject,
  canDelete,
  canSendSms,
  onBranchIdChange,
  onSingleRollChange,
  onSingleMarksChange,
  onSingleTotalChange,
  onBulkRowsChange,
  onExcelFileChange,
  onSubmitSingle,
  onSubmitBulk,
  onSubmitExcel,
  onOpenSmsWorkspace,
  onBatchUpdated,
  isCombinedOffline = false,
}: OfflineResultsTabProps) {
  const toast = useAdminToast();
  const [batchBusyId, setBatchBusyId] = useState<string | null>(null);
  const missingBranch = !selectedBranchId && !examBranchId;

  const runBatchAction = async (
    batch: ResultBatchSummary,
    label: string,
    action: () => Promise<{ success?: boolean; message?: string }>,
  ) => {
    setBatchBusyId(batch.id);
    try {
      const response = await action();
      if (!response.success) throw new Error(response.message || `${label} failed`);
      toast({ title: label });
      onBatchUpdated();
    } catch (error) {
      toast({
        title: label,
        description: error instanceof Error ? error.message : 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setBatchBusyId(null);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Offline result entry</CardTitle>
        <CardDescription>
          Teachers can input checked script marks one by one, paste bulk rows, or upload Excel. Rows enter the
          approval queue before students see results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!examBranchId ? (
          <div className="max-w-sm space-y-2">
            <label className="text-xs font-semibold text-slate-600">Branch for this result batch</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={branchId}
              onChange={(event) => onBranchIdChange(event.target.value)}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        {canEnter ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-bold text-slate-900">Single result</p>
              <div className="mt-3 space-y-2">
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  placeholder="Roll / registration / mobile"
                  value={singleRoll}
                  onChange={(event) => onSingleRollChange(event.target.value)}
                />
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  placeholder="Marks obtained"
                  value={singleMarks}
                  onChange={(event) => onSingleMarksChange(event.target.value)}
                />
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  placeholder="Total marks (optional)"
                  value={singleTotal}
                  onChange={(event) => onSingleTotalChange(event.target.value)}
                />
                <Button type="button" size="sm" disabled={offlineBusy || missingBranch} onClick={onSubmitSingle}>
                  Queue single result
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-bold text-slate-900">Bulk paste</p>
              <textarea
                className="mt-3 h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder={'REG-001, 82, 100, Good\nREG-002, 74, 100'}
                value={bulkRows}
                onChange={(event) => onBulkRowsChange(event.target.value)}
              />
              <Button type="button" size="sm" disabled={offlineBusy || missingBranch} onClick={onSubmitBulk}>
                Validate & queue bulk
              </Button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-bold text-slate-900">Excel import</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {isCombinedOffline
                  ? 'COMBINED exam: column A = roll, column C = CQ marks only (MCQ comes from OMR finalize).'
                  : 'Columns: roll, name, marks, total, comments'}
              </p>
              <input
                className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => onExcelFileChange(event.target.files?.[0] ?? null)}
              />
              <Button className="mt-3" type="button" size="sm" disabled={offlineBusy || !excelFile || missingBranch} onClick={onSubmitExcel}>
                Upload Excel
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            You do not have permission to enter offline results on this exam.
          </p>
        )}

        {offlineErrors.length ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-900">Validation warnings</p>
            <div className="mt-2 max-h-36 overflow-auto text-xs text-amber-900">
              {offlineErrors.slice(0, 20).map((error, index) => (
                <p key={index}>{JSON.stringify(error)}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Input mode</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultBatches.length ? resultBatches.map((batch) => {
                const busy = batchBusyId === batch.id;
                return (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.inputMode}</TableCell>
                    <TableCell>{batch.totalRecords}</TableCell>
                    <TableCell>{batch.approvalStatus}</TableCell>
                    <TableCell>{batch.uploaderUser?.fullName ?? '—'}</TableCell>
                    <TableCell>{new Date(batch.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {batch.approvalStatus === 'PENDING' && canApproveBranch ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="gap-1"
                            onClick={() =>
                              void runBatchAction(batch, 'Branch approved', () =>
                                approveResultBatchBranch(examId, batch.id),
                              )
                            }
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
                            Branch
                          </Button>
                        ) : null}
                        {batch.approvalStatus === 'APPROVED_BY_BRANCH' && canApproveCentral ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="gap-1 border-emerald-200 text-emerald-800"
                            onClick={() =>
                              void runBatchAction(batch, 'Central approved', () =>
                                approveResultBatchCentral(examId, batch.id),
                              )
                            }
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                            Central
                          </Button>
                        ) : null}
                        {(batch.approvalStatus === 'PENDING'
                          || (batch.approvalStatus === 'APPROVED_BY_BRANCH' && canApproveCentral))
                          && canReject ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="gap-1 border-rose-200 text-rose-700"
                            onClick={() => {
                              const note = window.prompt('Enter the rejection reason for this result batch.');
                              if (!note?.trim()) {
                                toast({ title: 'Rejection reason required', variant: 'destructive' });
                                return;
                              }
                              void runBatchAction(batch, 'Batch rejected', () =>
                                rejectResultBatch(examId, batch.id, note.trim()),
                              );
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        ) : null}
                        {batch.approvalStatus === 'PENDING' && canDelete ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            className="gap-1 text-slate-600"
                            onClick={async () => {
                              if (!(await confirmAction({
                                title: 'Delete result batch?',
                                description: 'This cannot be undone.',
                                confirmLabel: 'Delete',
                                variant: 'danger',
                              }))) {
                                return;
                              }
                              void runBatchAction(batch, 'Batch deleted', () => deleteResultBatch(examId, batch.id));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        ) : null}
                        {canSendSms ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              !['APPROVED_BY_BRANCH', 'APPROVED_BY_CENTRAL'].includes(batch.approvalStatus)
                            }
                            onClick={() => onOpenSmsWorkspace(batch)}
                            className="gap-1"
                          >
                            <MessageSquare className="h-4 w-4" />
                            SMS
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-500">
                    No result batches queued yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
