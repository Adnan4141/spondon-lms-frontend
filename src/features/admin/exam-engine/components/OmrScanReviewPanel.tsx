'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileScan, Loader2, RefreshCcw, Sparkles, Trash2, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { getActorUserIdFromStorage } from '@/lib/actor-user';
import {
  discardOmrScan,
  finalizeOmrBatch,
  getOmrEngineStatus,
  getOmrRoster,
  getOmrScans,
  getOmrScanDownloadUrl,
  getOmrSetKeys,
  overrideOmrAnswers,
  reassignOmrScan,
  uploadOmrScanBatch,
  type DetectedAnswer,
  type OmrEngineStatus,
  type OmrRosterStudent,
  type OmrScan,
  type OmrScanBatch,
  type OmrScanStatus,
  type OmrSetKeysResponse,
} from '@/lib/api/omr-scans';
import { Input } from '@/components/ui/input';

type BranchOption = { id: string; name: string };

type Props = {
  examId: string;
  branchId?: string | null;
  examBranchId?: string | null;
  branches?: BranchOption[];
  /** When true (e.g. Super Admin + all-branches exam), show branch selector before finalize. */
  showBranchPicker?: boolean;
  onBranchIdChange?: (branchId: string) => void;
  onFinalized?: (resultBatchId: string) => void;
};

const ACCEPTED_STATUSES: OmrScanStatus[] = ['PROCESSED', 'REVIEW_NEEDED'];
const REJECTED_STATUSES: OmrScanStatus[] = ['REJECTED'];

const IDENTITY_WARNING_LABELS: Record<string, string> = {
  SET_MISMATCH: 'Set mismatch',
  BRANCH_MISMATCH: 'Branch mismatch',
  SET_LABEL_MISSING_DEFAULTED_FIRST: 'Set not detected — used first set key',
  SET_LABEL_UNMAPPED: 'Unknown set — used first set key',
  DUPLICATE_STUDENT_SCAN: 'Duplicate scan (same student in another batch)',
  STUDENT_ALREADY_FINALIZED: 'Student already in results',
};

function labelIdentityWarning(code: string): string {
  if (code.startsWith('SET_LABEL_UNMAPPED_')) {
    return `Unknown set ${code.replace('SET_LABEL_UNMAPPED_', '')} — used first set key`;
  }
  return IDENTITY_WARNING_LABELS[code] ?? code;
}

const REJECTION_LABELS: Record<string, string> = {
  NO_QR_NO_ROLL: 'No QR / unreadable roll',
  LOW_OVERALL_CONFIDENCE: 'Low confidence',
  ALIGNMENT_FAIL: 'Alignment failed',
  BLANK_SHEET: 'Looks blank',
  UNREADABLE_IMAGE: 'Image unreadable',
  STUDENT_NOT_ENROLLED: 'Student not enrolled',
};

const STATUS_BADGE: Record<OmrScanStatus, { label: string; className: string }> = {
  PENDING: { label: 'Queued', className: 'bg-slate-200 text-slate-700' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  PROCESSED: { label: 'Graded', className: 'bg-emerald-100 text-emerald-700' },
  REVIEW_NEEDED: { label: 'Review', className: 'bg-amber-100 text-amber-700' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-100 text-rose-700' },
  DISCARDED: { label: 'Discarded', className: 'bg-slate-100 text-slate-500' },
};

export function OmrScanReviewPanel({
  examId,
  branchId,
  examBranchId,
  branches = [],
  showBranchPicker = false,
  onBranchIdChange,
  onFinalized,
}: Props) {
  const toast = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scans, setScans] = useState<OmrScan[]>([]);
  const [batches, setBatches] = useState<OmrScanBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [finalizingBatchId, setFinalizingBatchId] = useState<string | null>(null);
  const [actionBusyScanId, setActionBusyScanId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [page, setPage] = useState(1);
  const [totalScans, setTotalScans] = useState(0);
  const pageSize = 50;
  const [reassignTarget, setReassignTarget] = useState<OmrScan | null>(null);
  const [rosterQuery, setRosterQuery] = useState('');
  const [rosterRows, setRosterRows] = useState<OmrRosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<OmrScan | null>(null);
  const [editAnswers, setEditAnswers] = useState<DetectedAnswer[]>([]);
  const [setKeysInfo, setSetKeysInfo] = useState<OmrSetKeysResponse | null>(null);
  const [engineStatus, setEngineStatus] = useState<OmrEngineStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getOmrScans(examId, { page, pageSize });
      if (r.success && r.data) {
        setScans(r.data.scans);
        setBatches(r.data.batches);
        setTotalScans(r.data.total);
      }
    } catch (err) {
      toast({
        title: 'Could not load OMR scans',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [examId, page, pageSize, toast]);

  useEffect(() => {
    void load();
  }, [load, refreshTick]);

  useEffect(() => {
    void Promise.all([getOmrSetKeys(examId), getOmrEngineStatus(examId)]).then(([keysRes, engineRes]) => {
      if (keysRes.success && keysRes.data) setSetKeysInfo(keysRes.data);
      if (engineRes.success && engineRes.data) setEngineStatus(engineRes.data);
    });
  }, [examId]);

  useEffect(() => {
    if (!reassignTarget) return;
    const q = rosterQuery.trim();
    const timer = window.setTimeout(() => {
      setRosterLoading(true);
      void getOmrRoster(examId, { q: q || undefined, limit: 40 })
        .then((r) => {
          if (r.success && r.data) setRosterRows(r.data.students);
        })
        .finally(() => setRosterLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [reassignTarget, rosterQuery, examId]);

  // Auto-poll while any scan is still pending/processing so progress shows live.
  useEffect(() => {
    const hasInFlight = scans.some((s) => s.status === 'PENDING' || s.status === 'PROCESSING')
      || batches.some((b) => b.status === 'PENDING' && b.processedCount < b.totalScans);
    if (!hasInFlight) return;
    const id = window.setInterval(() => setRefreshTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, [scans, batches]);

  const accepted = useMemo(
    () => scans.filter((s) => ACCEPTED_STATUSES.includes(s.status as OmrScanStatus)),
    [scans],
  );
  const rejected = useMemo(
    () => scans.filter((s) => REJECTED_STATUSES.includes(s.status as OmrScanStatus)),
    [scans],
  );
  const queued = useMemo(
    () => scans.filter((s) => s.status === 'PENDING' || s.status === 'PROCESSING'),
    [scans],
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const uploadedBy = getActorUserIdFromStorage();
    if (!uploadedBy) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const r = await uploadOmrScanBatch(examId, Array.from(files), {
        branchId: branchId || examBranchId || undefined,
        uploadedBy,
      });
      if (!r.success) {
        toast({
          title: 'Upload failed',
          description: r.message ?? 'Server rejected the upload',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: `Queued ${r.data.totalScans} OMR scan${r.data.totalScans === 1 ? '' : 's'}`,
        description: r.data.duplicateFiles?.length
          ? `Skipped duplicate file(s): ${r.data.duplicateFiles.join(', ')}`
          : 'Auto-grading runs in the background — results appear here as they complete.',
      });
      setRefreshTick((t) => t + 1);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openReassign = (scan: OmrScan) => {
    setReassignTarget(scan);
    setRosterQuery(scan.student?.fullName ?? scan.student?.registrationNumber ?? '');
  };

  const confirmReassign = async (studentUserId: string) => {
    if (!reassignTarget) return;
    setActionBusyScanId(reassignTarget.id);
    try {
      const r = await reassignOmrScan(examId, reassignTarget.id, studentUserId);
      if (!r.success) {
        toast({ title: r.message ?? 'Reassign failed', variant: 'destructive' });
        return;
      }
      toast({ title: 'Scan reassigned', description: 'Marks were recomputed against the answer key.' });
      setReassignTarget(null);
      setRefreshTick((t) => t + 1);
    } finally {
      setActionBusyScanId(null);
    }
  };

  const openEditAnswers = (scan: OmrScan) => {
    const answers = Array.isArray(scan.detectedAnswers) ? [...scan.detectedAnswers] : [];
    setEditTarget(scan);
    setEditAnswers(answers);
  };

  const setAnswerChoice = (q: number, choice: string | null) => {
    setEditAnswers((prev) => {
      const idx = prev.findIndex((a) => a.q === q);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], choice };
        return next;
      }
      return [...prev, { q, choice, conf: 1 }];
    });
  };

  const saveEditedAnswers = async () => {
    if (!editTarget) return;
    setActionBusyScanId(editTarget.id);
    try {
      const payload = editAnswers.map((a) => ({ q: a.q, choice: a.choice, conf: a.conf ?? 1 }));
      const r = await overrideOmrAnswers(examId, editTarget.id, payload);
      if (!r.success) {
        toast({ title: r.message ?? 'Could not save answers', variant: 'destructive' });
        return;
      }
      toast({ title: 'Answers updated', description: 'Marks were recomputed from the answer key.' });
      setEditTarget(null);
      setRefreshTick((t) => t + 1);
    } finally {
      setActionBusyScanId(null);
    }
  };

  const discard = async (scan: OmrScan) => {
    if (!(await confirmAction({
      title: 'Discard this scan?',
      description: 'It will be excluded from finalize.',
      confirmLabel: 'Discard',
      variant: 'danger',
    }))) return;
    setActionBusyScanId(scan.id);
    try {
      const r = await discardOmrScan(examId, scan.id);
      if (!r.success) {
        toast({ title: r.message ?? 'Discard failed', variant: 'destructive' });
        return;
      }
      setRefreshTick((t) => t + 1);
    } finally {
      setActionBusyScanId(null);
    }
  };

  const effectiveBranchId = branchId || examBranchId || '';
  const needsBranchSelection = showBranchPicker && !examBranchId && !effectiveBranchId;

  const finalize = async (batch: OmrScanBatch) => {
    if (batch.status === 'FINALIZED') return;
    const uploadedBy = getActorUserIdFromStorage();
    if (!uploadedBy) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    const finalizeBranchId = branchId || examBranchId || batch.branchId || undefined;
    if (showBranchPicker && !examBranchId && !finalizeBranchId) {
      toast({
        title: 'Select a branch',
        description: 'All-branches exams need a branch before writing OMR results to the result queue.',
        variant: 'destructive',
      });
      return;
    }
    setFinalizingBatchId(batch.id);
    try {
      const r = await finalizeOmrBatch(examId, batch.id, {
        branchId: finalizeBranchId,
        uploadedBy,
      });
      if (!r.success) {
        toast({
          title: r.message ?? 'Finalize failed',
          description: 'Make sure scans have matched students. For all-branches exams, pick a branch above.',
          variant: 'destructive',
        });
        return;
      }
      const dupNote = r.data.duplicateScans?.length
        ? ` ${r.data.duplicateScans.length} duplicate scan(s) in this batch were skipped.`
        : '';
      const crossNote = r.data.crossBatchDuplicates?.length
        ? ` ${r.data.crossBatchDuplicates.length} scan(s) skipped — student already has results or a better scan elsewhere.`
        : '';
      toast({
        title: 'Result batch created',
        description: `${r.data.totalRecords} rows ready for branch / central approval. Open the Offline results tab to approve.${dupNote}${crossNote}`,
      });
      onFinalized?.(r.data.resultBatchId);
      setRefreshTick((t) => t + 1);
    } finally {
      setFinalizingBatchId(null);
    }
  };

  return (
    <Card className="w-full max-w-full min-w-0 border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">OMR scans</CardTitle>
          <CardDescription>
            Upload scanned answer sheets (Canon LiDE @ 300dpi recommended). The engine reads the QR, matches the student, and grades against the answer key. Anything ambiguous lands in <strong>Review</strong>.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setRefreshTick((t) => t + 1)}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {(setKeysInfo || engineStatus) ? (
          <div className="grid gap-3 md:grid-cols-2">
            {setKeysInfo ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Multi-SET answer keys</p>
                <p className="mt-1">{setKeysInfo.recommendation}</p>
                {setKeysInfo.keys.length > 1 ? (
                  <ul className="mt-2 space-y-1">
                    {setKeysInfo.keys.map((k) => (
                      <li key={k.examSetId}>
                        Sheet <strong>{k.sheetLabel}</strong> → set &quot;{k.examSetName}&quot; ({k.questionCount} MCQ)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-500">Single set — all scans grade against &quot;{setKeysInfo.keys[0]?.examSetName ?? '—'}&quot;.</p>
                )}
              </div>
            ) : null}
            {engineStatus ? (
              <div className={`rounded-lg border p-3 text-xs ${engineStatus.openCvLoaded ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900' : 'border-amber-200 bg-amber-50/80 text-amber-900'}`}>
                <p className="font-bold">Scan engine: {engineStatus.alignmentMode.replace(/_/g, ' ')}</p>
                <p className="mt-1">{engineStatus.recommendation}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showBranchPicker && !examBranchId ? (
          <div className="max-w-sm space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <label className="text-xs font-semibold text-amber-900">Branch for result batch</label>
            <p className="text-[11px] text-amber-800">
              This exam applies to all branches. Choose which branch receives the result batch when you write OMR scans to results (Super Admin can pick any branch).
            </p>
            <select
              className="h-10 w-full rounded-md border border-amber-200 bg-white px-3 text-sm"
              value={branchId ?? ''}
              onChange={(event) => onBranchIdChange?.(event.target.value)}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {needsBranchSelection ? (
              <p className="text-[11px] font-medium text-amber-900">Required before &quot;Write to results&quot;.</p>
            ) : null}
          </div>
        ) : null}

        {/* ── Upload ─────────────────────────────────────────────────── */}
        <div
          className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleUpload(e.dataTransfer.files);
          }}
        >
          <FileScan className="mx-auto h-7 w-7 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-800">Drop scanned sheets here</p>
          <p className="text-xs text-slate-500">JPEG, PNG, WebP, or multi-page PDF (PDFs are auto-split).</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            className="mt-3 gap-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Choose files
          </Button>
        </div>

        {/* ── Batches ────────────────────────────────────────────────── */}
        {batches.length ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Scan batches</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => {
                    const pct = b.totalScans > 0 ? Math.round((b.processedCount / b.totalScans) * 100) : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs text-slate-500">{b.id.slice(-8)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-slate-100">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">
                              {b.processedCount}/{b.totalScans}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-[10px]">{b.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {new Date(b.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={b.status === 'FINALIZED' || b.status === 'CANCELLED' || finalizingBatchId === b.id || b.processedCount === 0}
                            onClick={() => void finalize(b)}
                          >
                            {finalizingBatchId === b.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {b.status === 'FINALIZED' ? 'Finalized' : 'Write to results'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        {/* ── Queued + accepted + rejected counters ─────────────────── */}
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Queued" value={queued.length} tone="slate" />
          <SummaryTile label="Auto-graded" value={accepted.length} tone="emerald" />
          <SummaryTile label="Rejected / review" value={rejected.length} tone="rose" />
        </div>

        {/* ── Accepted scans ─────────────────────────────────────────── */}
        <ScanTable
          title="Auto-graded"
          subtitle="Engine matched the student and computed marks. Review badge means the engine wants a human glance before writing the result."
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          loading={loading}
          rows={accepted}
          actionBusyScanId={actionBusyScanId}
          onReassign={(s) => openReassign(s)}
          onEditAnswers={(s) => openEditAnswers(s)}
          onDiscard={(s) => void discard(s)}
        />

        {/* ── Rejected scans ─────────────────────────────────────────── */}
        <ScanTable
          title="Needs review"
          subtitle="Engine couldn't grade automatically. Use Assign to attach the right student, then Re-grade picks up the existing detected answers."
          icon={<XCircle className="h-4 w-4 text-rose-600" />}
          loading={loading}
          rows={rejected}
          actionBusyScanId={actionBusyScanId}
          onReassign={(s) => openReassign(s)}
          onEditAnswers={(s) => openEditAnswers(s)}
          onDiscard={(s) => void discard(s)}
        />

        {totalScans > pageSize ? (
          <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              Page {page} · {totalScans} scans total
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page * pageSize >= totalScans || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {editTarget ? (
          <AnswerOverrideModal
            scan={editTarget}
            answers={editAnswers}
            busy={actionBusyScanId === editTarget.id}
            onChoiceChange={setAnswerChoice}
            onClose={() => setEditTarget(null)}
            onSave={() => void saveEditedAnswers()}
          />
        ) : null}

        {reassignTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="font-bold text-slate-900">Assign scan to student</p>
                <p className="text-xs text-slate-500 truncate">
                  {reassignTarget.fileName ?? reassignTarget.id}
                </p>
              </div>
              <div className="space-y-3 p-4">
                <Input
                  placeholder="Search name or registration…"
                  value={rosterQuery}
                  onChange={(e) => setRosterQuery(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto rounded border border-slate-200">
                  {rosterLoading ? (
                    <p className="p-4 text-center text-sm text-slate-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </p>
                  ) : rosterRows.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-500">No enrolled students match.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {rosterRows.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            disabled={actionBusyScanId === reassignTarget.id}
                            onClick={() => void confirmReassign(s.id)}
                          >
                            <span className="font-semibold text-slate-900">{s.fullName ?? '—'}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              {s.registrationNumber ?? s.id}
                              {s.branchCode ? ` · ${s.branchCode}` : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setReassignTarget(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'rose';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-lg border px-3 py-2 ${cls}`}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

const OPTION_CHOICES: Record<3 | 4 | 5, string[]> = {
  3: ['A', 'B', 'C'],
  4: ['A', 'B', 'C', 'D'],
  5: ['A', 'B', 'C', 'D', 'E'],
};

function AnswerOverrideModal({
  scan,
  answers,
  busy,
  onChoiceChange,
  onClose,
  onSave,
}: {
  scan: OmrScan;
  answers: DetectedAnswer[];
  busy: boolean;
  onChoiceChange: (q: number, choice: string | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const maxQ = answers.length ? Math.max(...answers.map((a) => a.q)) : 0;
  const optionCount: 3 | 4 | 5 = answers.some((a) => a.choice === 'E') ? 5 : 4;
  const choices = OPTION_CHOICES[optionCount];
  const rows = maxQ > 0
    ? Array.from({ length: maxQ }, (_, i) => i + 1)
    : answers.map((a) => a.q).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="font-bold text-slate-900">Edit detected answers</p>
          <p className="truncate text-xs text-slate-500">{scan.fileName ?? scan.id}</p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">No detected answers on this scan yet.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((q) => {
                const current = answers.find((a) => a.q === q)?.choice ?? null;
                return (
                  <li key={q} className="flex flex-wrap items-center gap-2 rounded border border-slate-100 px-3 py-2">
                    <span className="w-10 text-xs font-bold text-slate-500">Q{q}</span>
                    {choices.map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        className={`h-7 min-w-7 rounded px-2 text-xs font-bold ${
                          current === letter
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        onClick={() => onChoiceChange(q, current === letter ? null : letter)}
                      >
                        {letter}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ml-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                      onClick={() => onChoiceChange(q, null)}
                    >
                      Blank
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={busy || rows.length === 0}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save &amp; regrade
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScanTable({
  title,
  subtitle,
  icon,
  loading,
  rows,
  actionBusyScanId,
  onReassign,
  onEditAnswers,
  onDiscard,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  loading: boolean;
  rows: OmrScan[];
  actionBusyScanId: string | null;
  onReassign: (s: OmrScan) => void;
  onEditAnswers: (s: OmrScan) => void;
  onDiscard: (s: OmrScan) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
          {rows.length}
        </span>
      </div>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sheet</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Reg (grid)</TableHead>
              <TableHead>Set</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="py-6 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-6 text-center text-sm text-slate-500">
                  Nothing here yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((scan) => {
                const status = STATUS_BADGE[scan.status as OmrScanStatus];
                return (
                  <TableRow key={scan.id}>
                    <TableCell className="max-w-[220px]">
                      <a
                        className="block truncate text-xs font-bold text-violet-700 hover:underline"
                        href={getOmrScanDownloadUrl(scan.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {scan.fileName ?? scan.fileUrl.split('/').pop()}
                      </a>
                      {scan.pageIndex != null ? (
                        <span className="text-[10px] text-slate-400">page {scan.pageIndex + 1}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {scan.student?.fullName ? (
                        <div>
                          <p className="font-bold text-slate-900">{scan.student.fullName}</p>
                          <p className="text-[10px] text-slate-500">{scan.student.registrationNumber ?? scan.studentUserId}</p>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Unmatched</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {scan.registrationFromGrid ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {scan.gradingSetLabel
                        ? `Key ${scan.gradingSetLabel}${scan.detectedSetLabel && scan.gradingSetLabel !== scan.detectedSetLabel ? ` (read ${scan.detectedSetLabel})` : ''}`
                        : scan.detectedSetLabel
                          ? `${scan.detectedSetLabel}${scan.expectedSetLabel && scan.detectedSetLabel !== scan.expectedSetLabel ? ` / exp ${scan.expectedSetLabel}` : ''}`
                          : scan.expectedSetLabel ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{scan.detectedBranchCode ?? '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{scan.detectedRoll ?? '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex flex-col gap-1">
                        {scan.rejectionReason ? (
                          <Badge variant="outline" className="border-rose-300 text-[10px] text-rose-700 w-fit">
                            {REJECTION_LABELS[scan.rejectionReason] ?? scan.rejectionReason}
                          </Badge>
                        ) : null}
                        {(scan.identityWarnings ?? []).map((w) => (
                          <Badge key={w} variant="outline" className="border-amber-300 text-[10px] text-amber-800 w-fit">
                            {labelIdentityWarning(w)}
                          </Badge>
                        ))}
                        {!scan.rejectionReason && !(scan.identityWarnings?.length) ? '—' : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold">
                      {scan.marks != null ? scan.marks.toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-600">
                      {scan.confidence != null ? `${Math.round(scan.confidence * 100)}%` : '—'}
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                          {status.label}
                        </span>
                      ) : (
                        scan.status
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {Array.isArray(scan.detectedAnswers) && scan.detectedAnswers.length > 0 ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            disabled={actionBusyScanId === scan.id}
                            onClick={() => onEditAnswers(scan)}
                          >
                            Edit
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-[11px]"
                          disabled={actionBusyScanId === scan.id}
                          onClick={() => onReassign(scan)}
                        >
                          Assign
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-[11px] text-rose-600 hover:bg-rose-50"
                          disabled={actionBusyScanId === scan.id}
                          onClick={() => onDiscard(scan)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
