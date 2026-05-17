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
  getOmrScans,
  getOmrScanDownloadUrl,
  reassignOmrScan,
  uploadOmrScanBatch,
  type OmrScan,
  type OmrScanBatch,
  type OmrScanStatus,
} from '@/lib/api/exam-results';

type Props = {
  examId: string;
  branchId?: string | null;
  onFinalized?: (resultBatchId: string) => void;
};

const ACCEPTED_STATUSES: OmrScanStatus[] = ['PROCESSED', 'REVIEW_NEEDED'];
const REJECTED_STATUSES: OmrScanStatus[] = ['REJECTED'];

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

export function OmrScanReviewPanel({ examId, branchId, onFinalized }: Props) {
  const toast = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scans, setScans] = useState<OmrScan[]>([]);
  const [batches, setBatches] = useState<OmrScanBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [finalizingBatchId, setFinalizingBatchId] = useState<string | null>(null);
  const [actionBusyScanId, setActionBusyScanId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getOmrScans(examId, { pageSize: 200 });
      if (r.success && r.data) {
        setScans(r.data.scans);
        setBatches(r.data.batches);
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
  }, [examId, toast]);

  useEffect(() => {
    void load();
  }, [load, refreshTick]);

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
        branchId: branchId ?? undefined,
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
        description: 'Auto-grading runs in the background — results appear here as they complete.',
      });
      setRefreshTick((t) => t + 1);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const reassign = async (scan: OmrScan) => {
    const studentId = window.prompt(
      'Enter the student user ID to assign this scan to.\n(Tip: copy it from the student profile page.)',
      scan.studentUserId ?? '',
    );
    if (!studentId) return;
    setActionBusyScanId(scan.id);
    try {
      const r = await reassignOmrScan(examId, scan.id, studentId.trim());
      if (!r.success) {
        toast({ title: r.message ?? 'Reassign failed', variant: 'destructive' });
        return;
      }
      toast({ title: 'Scan reassigned', description: 'Marks were recomputed against the answer key.' });
      setRefreshTick((t) => t + 1);
    } finally {
      setActionBusyScanId(null);
    }
  };

  const discard = async (scan: OmrScan) => {
    if (!window.confirm('Discard this scan? It will be excluded from finalize.')) return;
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

  const finalize = async (batch: OmrScanBatch) => {
    if (batch.status === 'FINALIZED') return;
    const uploadedBy = getActorUserIdFromStorage();
    if (!uploadedBy) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    setFinalizingBatchId(batch.id);
    try {
      const r = await finalizeOmrBatch(examId, batch.id, {
        branchId: branchId ?? batch.branchId ?? undefined,
        uploadedBy,
      });
      if (!r.success) {
        toast({
          title: r.message ?? 'Finalize failed',
          description: 'Make sure scans have matched students and the branch is set.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Result batch created',
        description: `${r.data.totalRecords} rows ready for branch / central approval.`,
      });
      onFinalized?.(r.data.resultBatchId);
      setRefreshTick((t) => t + 1);
    } finally {
      setFinalizingBatchId(null);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
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
          onReassign={(s) => void reassign(s)}
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
          onReassign={(s) => void reassign(s)}
          onDiscard={(s) => void discard(s)}
        />
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

function ScanTable({
  title,
  subtitle,
  icon,
  loading,
  rows,
  actionBusyScanId,
  onReassign,
  onDiscard,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  loading: boolean;
  rows: OmrScan[];
  actionBusyScanId: string | null;
  onReassign: (s: OmrScan) => void;
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
              <TableHead>Detected roll</TableHead>
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
                <TableCell colSpan={8} className="py-6 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-slate-500">
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
                    <TableCell className="text-xs text-slate-600">{scan.detectedRoll ?? '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {scan.rejectionReason ? (
                        <Badge variant="outline" className="border-rose-300 text-[10px] text-rose-700">
                          {REJECTION_LABELS[scan.rejectionReason] ?? scan.rejectionReason}
                        </Badge>
                      ) : '—'}
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
