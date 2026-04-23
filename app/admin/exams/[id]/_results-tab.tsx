'use client';

/**
 * Offline results tab — 3 method cards (manual / bulk excel / OMR) + approval
 * workflow stepper. Pure shadcn.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  PlusCircle,
  Scan,
  Trash2,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

import {
  approveResultBatchBranch,
  approveResultBatchCentral,
  deleteResultBatch,
  listExamResultBatches,
  postExamResultBulkExcel,
  postExamResultSingle,
  rejectResultBatch,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { uploadOmrScan } from '@/lib/api/exam-results';
import type { Exam } from '@/types/exam';

const STAGES = [
  { id: 'PENDING', label: 'Branch upload' },
  { id: 'BRANCH_APPROVED', label: 'Branch review' },
  { id: 'CENTRAL_APPROVED', label: 'Central approval' },
  { id: 'PUBLISHED', label: 'Published' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

export function ResultsTab({
  exam,
  onExamChange: _onExamChange,
}: {
  exam: Exam;
  onExamChange: (e: Exam) => void;
}) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<ResultBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [omrOpen, setOmrOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listExamResultBatches(exam.id);
    if (res.success && res.data) setBatches(res.data);
    setLoading(false);
  }, [exam.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApproveBranch = async (batchId: string) => {
    const res = await approveResultBatchBranch(exam.id, batchId);
    if (res.success) {
      toast({ description: 'Branch approval recorded' });
      load();
    }
  };

  const handleApproveCentral = async (batchId: string) => {
    const notes = window.prompt('Central approval notes (optional)') ?? undefined;
    const res = await approveResultBatchCentral(exam.id, batchId, notes);
    if (res.success) {
      toast({ description: 'Central approval recorded' });
      load();
    }
  };

  const handleReject = async (batchId: string) => {
    const notes = window.prompt('Rejection reason') ?? '';
    const res = await rejectResultBatch(exam.id, batchId, notes);
    if (res.success) {
      toast({ description: 'Batch rejected' });
      load();
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!window.confirm('Delete this batch and all its rows?')) return;
    const res = await deleteResultBatch(exam.id, batchId);
    if (res.success) {
      toast({ description: 'Batch deleted' });
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MethodCard
          icon={PlusCircle}
          title="Manual entry"
          description="Enter individual student marks by registration/roll number."
          actionLabel="Enter marks"
          onAction={() => setManualOpen(true)}
        />
        <MethodCard
          icon={FileSpreadsheet}
          title="Bulk Excel"
          description="Upload a spreadsheet (.xlsx/.csv) of roll numbers and marks."
          actionLabel="Upload file"
          onAction={() => setBulkOpen(true)}
        />
        <MethodCard
          icon={Scan}
          title="OMR scan"
          description="Upload an OMR sheet image for automated scoring."
          actionLabel="Upload OMR"
          onAction={() => setOmrOpen(true)}
        />
      </div>

      {/* Approval workflow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Approval workflow</CardTitle>
          <CardDescription className="text-xs">
            Branch upload → Branch review → Central approval → Published
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : batches.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No result batches yet. Use a method above to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {b.branch?.name ?? 'Central'} · {b.inputMode}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Uploaded by {b.uploaderUser?.fullName ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{b.totalRecords}</TableCell>
                    <TableCell>
                      <Stepper currentStage={b.approvalStatus as StageId} />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <BatchActions
                        batch={b}
                        onApproveBranch={() => handleApproveBranch(b.id)}
                        onApproveCentral={() => handleApproveCentral(b.id)}
                        onReject={() => handleReject(b.id)}
                        onDelete={() => handleDelete(b.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ManualEntryDialog
        examId={exam.id}
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSaved={load}
      />
      <BulkExcelDialog
        examId={exam.id}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSaved={load}
      />
      <OmrUploadDialog
        examId={exam.id}
        open={omrOpen}
        onOpenChange={setOmrOpen}
        onSaved={load}
      />
    </div>
  );
}

// ── Method card ───────────────────────────────────────────────────────────
function MethodCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <CardTitle className="mt-3 text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="sm" className="w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────
function Stepper({ currentStage }: { currentStage: StageId }) {
  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);
  const effectiveIdx = currentIdx < 0 ? 0 : currentIdx;

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s, i) => {
        const done = i < effectiveIdx;
        const active = i === effectiveIdx;
        return (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : active ? (
                <CircleDot className="h-3 w-3" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-[11px]">{s.label}</span>
            {i < STAGES.length - 1 && <span className="text-muted-foreground">›</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Batch actions ─────────────────────────────────────────────────────────
function BatchActions({
  batch,
  onApproveBranch,
  onApproveCentral,
  onReject,
  onDelete,
}: {
  batch: ResultBatchSummary;
  onApproveBranch: () => void;
  onApproveCentral: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const status = batch.approvalStatus;
  return (
    <div className="flex justify-end gap-1">
      {status === 'PENDING' && (
        <Button size="sm" variant="outline" onClick={onApproveBranch}>
          Branch approve
        </Button>
      )}
      {status === 'BRANCH_APPROVED' && (
        <Button size="sm" variant="outline" onClick={onApproveCentral}>
          Central approve
        </Button>
      )}
      {(status === 'PENDING' || status === 'BRANCH_APPROVED') && (
        <Button size="sm" variant="ghost" onClick={onReject}>
          <XCircle className="h-3.5 w-3.5 text-destructive" />
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}

// ── Manual entry dialog ───────────────────────────────────────────────────
function ManualEntryDialog({
  examId,
  open,
  onOpenChange,
  onSaved,
}: {
  examId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [rollNo, setRollNo] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setRollNo('');
    setMarksObtained('');
    setTotalMarks('');
    setComments('');
  };

  const submit = async () => {
    if (!rollNo.trim() || !marksObtained.trim()) {
      toast({ description: 'Roll number and marks are required' });
      return;
    }
    setSaving(true);
    try {
      const res = await postExamResultSingle(examId, {
        rollNo: rollNo.trim(),
        marksObtained: Number(marksObtained),
        totalMarks: totalMarks.trim() ? Number(totalMarks) : undefined,
        comments: comments.trim() || undefined,
      });
      if (res.success) {
        toast({ description: 'Result saved' });
        reset();
        onSaved();
        onOpenChange(false);
      } else {
        toast({ description: res.message ?? 'Save failed' });
      }
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual result entry</DialogTitle>
          <DialogDescription>
            Enter a single student's marks. They'll be added to a pending branch batch.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rollNo">Roll / Registration no.</Label>
            <Input
              id="rollNo"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="marksObtained">Marks obtained</Label>
              <Input
                id="marksObtained"
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="totalMarks">Total marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Save result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk Excel dialog ─────────────────────────────────────────────────────
function BulkExcelDialog({
  examId,
  open,
  onOpenChange,
  onSaved,
}: {
  examId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (!file) {
      toast({ description: 'Select a spreadsheet first' });
      return;
    }
    setUploading(true);
    try {
      const res = await postExamResultBulkExcel(examId, file);
      if (res.success) {
        toast({ description: 'Batch uploaded for branch approval' });
        onSaved();
        onOpenChange(false);
        setFile(null);
      } else {
        toast({ description: res.message ?? 'Upload failed' });
      }
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk upload results</DialogTitle>
          <DialogDescription>
            Columns: <code>rollNo</code>, <code>marksObtained</code>,{' '}
            <code>totalMarks</code> (optional), <code>comments</code> (optional).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={uploading || !file}>
            {uploading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── OMR upload dialog ─────────────────────────────────────────────────────
function OmrUploadDialog({
  examId,
  open,
  onOpenChange,
  onSaved,
}: {
  examId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadOmrScan(examId, file);
      if (res.success) {
        toast({ description: 'OMR scan queued for processing' });
        onSaved();
        onOpenChange(false);
        setFile(null);
      }
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload OMR scan</DialogTitle>
          <DialogDescription>
            The scan will be processed asynchronously; results appear in the batches list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={uploading || !file}>
            {uploading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
