'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getExamById, updateExam, deleteExam } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import {
  ExamCreatorWizard,
  ExamSideNav,
  ExamOverviewPanel,
  ExamLeaderboard,
  ExamCoursesPanel,
  MeritListsTab,
  ExamSectionBuilder,
  BlueprintPresetsPanel,
  ExamQuestionBuilder,
  ExamSubjectBuilder,
  OmrSheetPreview,
  OmrGradingPanel,
  ExamResultBatchesPanel,
  WrittenEvaluationPanel,
} from '@/features/admin/exams';
import type { ExamDetailTab } from '@/features/admin/exams/components/ExamSideNav';
import {
  getOmrScans,
  uploadOmrScan,
  getOmrScanDownloadUrl,
  importOfflineResults,
  getOfflineResults,
  approveOfflineResult,
  rejectOfflineResult,
  type OmrScan,
} from '@/lib/api/exam-results';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle as XCircleIcon,
  Upload,
  FileSpreadsheet,
  Eye,
  FileText,
  Image,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex gap-5 animate-pulse">
      <div className="w-56 shrink-0 h-[600px] rounded-2xl bg-slate-100" />
      <div className="flex-1 space-y-5">
        <div className="h-10 rounded-2xl bg-slate-100 w-64" />
        <div className="h-52 rounded-2xl bg-slate-100" />
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

// ─── OMR Panel (extracted to keep page readable) ───────────────────────────

function OmrTabPanel({ exam, onRefresh }: { exam: Exam; onRefresh: () => void }) {
  const { toast } = useToast();
  const [omrScans, setOmrScans] = useState<OmrScan[]>([]);
  const [omrPreviews, setOmrPreviews] = useState<{ id: string; url: string; fileName: string }[]>([]);
  const [omrUploading, setOmrUploading] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const [offlineResults, setOfflineResults] = useState<
    { id: string; rollNo: string; approvalStatus: string; obtainedMarks?: number; totalMarks?: number }[]
  >([]);
  const [selectedPreview, setSelectedPreview] = useState<{ url: string; fileName: string } | null>(null);
  const omrRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getOmrScans(exam.id).then((r) => r.success && r.data && setOmrScans(r.data));
    getOfflineResults(exam.id).then((r) => r.success && r.data && setOfflineResults(r.data));
  }, [exam.id]);

  const handleOmrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOmrUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setOmrPreviews((p) => [...p, { id: `local-${Date.now()}`, url, fileName: file.name }]);
      };
      reader.readAsDataURL(file);
      const res = await uploadOmrScan(exam.id, file);
      if (res.success && res.data) setOmrScans((p) => [res.data!, ...p]);
    } finally { setOmrUploading(false); e.target.value = ''; }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelImporting(true);
    try {
      const res = await importOfflineResults(exam.id, file);
      if (res.success && res.data) {
        toast({ title: 'Import successful', description: `${res.data.count} result(s) imported.`, variant: 'success' });
        getOfflineResults(exam.id).then((r) => r.success && r.data && setOfflineResults(r.data));
      } else {
        toast({ title: 'Import failed', description: (res as any).message ?? 'Unknown error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Import failed', variant: 'destructive' });
    } finally { setExcelImporting(false); e.target.value = ''; }
  };

  const approve = async (id: string) => {
    const res = await approveOfflineResult(id);
    if (res.success) setOfflineResults((p) => p.map((r) => r.id === id ? { ...r, approvalStatus: 'APPROVED' } : r));
  };
  const reject = async (id: string) => {
    const res = await rejectOfflineResult(id);
    if (res.success) setOfflineResults((p) => p.map((r) => r.id === id ? { ...r, approvalStatus: 'REJECTED' } : r));
  };

  return (
    <div className="space-y-6">
      {/* Sheet preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">OMR Sheet Preview</h3>
        <OmrSheetPreview examId={exam.id} />
      </div>

      {/* Grading panel */}
      <OmrGradingPanel examId={exam.id} />

      {/* Scan upload + results */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Upload Scans & Results</h3>
        <div className="flex flex-wrap gap-3">
          <input ref={omrRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOmrUpload} disabled={omrUploading} />
          <Button variant="outline" className="gap-2 rounded-xl" disabled={omrUploading} onClick={() => omrRef.current?.click()}>
            {omrUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {omrUploading ? 'Uploading…' : 'Upload OMR / Scan'}
          </Button>
          <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} disabled={excelImporting} />
          <Button variant="outline" className="gap-2 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" disabled={excelImporting} onClick={() => excelRef.current?.click()}>
            {excelImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            {excelImporting ? 'Importing…' : 'Import Excel'}
          </Button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Excel columns: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">rollNo</code>,{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">totalMarks</code>,{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">obtainedMarks</code>
        </p>

        {/* OMR previews */}
        {omrPreviews.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3">Local Uploads</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {omrPreviews.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                  {p.url.startsWith('data:image') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.fileName} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center bg-slate-100">
                      <FileText className="h-10 w-10 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500">PDF</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl" onClick={() => setSelectedPreview(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 p-2 text-white text-[10px] truncate">{p.fileName}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline results table */}
        {offlineResults.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Imported rows ({offlineResults.length})</span>
              <span className="text-xs text-slate-500">{offlineResults.filter((r) => r.approvalStatus === 'PENDING').length} pending</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-white">
                    <TableHead className="text-xs">Roll</TableHead>
                    <TableHead className="text-xs">Score</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineResults.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-slate-900">{r.rollNo}</TableCell>
                      <TableCell className="tabular-nums text-slate-600">{r.obtainedMarks ?? '—'} / {r.totalMarks ?? '—'}</TableCell>
                      <TableCell>
                        {r.approvalStatus === 'APPROVED' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]" variant="outline">Approved</Badge>
                        ) : r.approvalStatus === 'REJECTED' ? (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]" variant="outline">Rejected</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]" variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.approvalStatus === 'PENDING' && (
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => approve(r.id)} title="Approve">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => reject(r.id)} title="Reject">
                              <XCircleIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Server-side scans */}
        {omrScans.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3">Server Files ({omrScans.length})</p>
            <ul className="space-y-2">
              {omrScans.map((scan) => (
                <li key={scan.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 hover:bg-slate-50">
                  <span className="truncate text-sm text-slate-700">{scan.fileName || 'Scan'}</span>
                  <a href={getOmrScanDownloadUrl(scan.fileUrl)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-medium text-indigo-600 hover:underline">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!selectedPreview} onOpenChange={(open) => { if (!open) setSelectedPreview(null); }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <DialogTitle className="truncate text-sm font-semibold text-slate-900">{selectedPreview?.fileName ?? 'Preview'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-black p-4 min-h-[300px]">
            {selectedPreview?.url.startsWith('data:image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPreview.url} alt={selectedPreview.fileName} className="max-h-[calc(90vh-160px)] w-auto object-contain" />
            ) : selectedPreview ? (
              <div className="flex flex-col items-center justify-center text-white py-12">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-sm">PDF preview not available</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { openModal, closeModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExamDetailTab>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // track sections refresh key so Sections tab re-mounts when blueprints apply
  const [sectionsKey, setSectionsKey] = useState(0);

  const loadExam = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getExamById(examId);
      if (res.success && res.data) setExam(res.data);
      else setError(res.message || 'Exam not found.');
    } catch (err: any) {
      setError(err.message || 'Failed to load exam.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { loadExam(); }, [loadExam]);

  const openEditWizard = () => {
    if (!exam) return;
    openModal({
      title: 'Edit Exam',
      description: 'Update exam configuration using the step-by-step builder.',
      className: 'sm:max-w-6xl h-[94vh]',
      content: (
        <ExamCreatorWizard
          exam={exam}
          onSuccess={async () => { await loadExam(); closeModal(); }}
          onClose={closeModal}
        />
      ),
    });
  };

  const handleDelete = async () => {
    if (!exam) return;
    try {
      setDeleting(true);
      await deleteExam(exam.id);
      toast({ title: 'Deleted', description: `"${exam.title}" has been removed.`, variant: 'success' });
      router.push('/admin/exams');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete.', variant: 'destructive' });
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!exam) return;
    const newStatus = exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      setPublishing(true);
      const res = await updateExam(exam.id, { status: newStatus });
      if (res.success && res.data) {
        setExam(res.data);
        toast({
          title: newStatus === 'PUBLISHED' ? 'Exam Published' : 'Exam set to Draft',
          variant: 'success',
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="h-16 w-16 rounded-[20px] bg-rose-50 border border-rose-100 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <p className="font-black text-slate-700">Failed to load exam</p>
          <p className="text-sm text-slate-400 mt-1">{error ?? 'The exam could not be found.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadExam} className="h-9 rounded-xl border-slate-200 text-sm font-bold">
            <RefreshCw className="mr-1.5 h-4 w-4" />Retry
          </Button>
          <Button asChild className="h-9 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-indigo-600">
            <Link href="/admin/exams">Back to Exams</Link>
          </Button>
        </div>
      </div>
    );
  }

  const leaderboardCourseOptions = (() => {
    const o: { id: string; name: string }[] = [];
    if (exam.courseId) o.push({ id: exam.courseId, name: exam.course?.name ?? 'Primary course' });
    for (const ec of exam.examCourses || []) o.push({ id: ec.courseId, name: ec.course?.name ?? ec.courseId });
    return o;
  })();

  const showOmr = exam.examEngine === 'OMR_BOOK' || exam.mode === 'OFFLINE';

  function renderContent() {
    switch (activeTab) {
      case 'overview':
        return <ExamOverviewPanel exam={exam!} onRefresh={loadExam} />;

      case 'sections':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* ExamSectionBuilder is the canonical section-first generation UI.
                Each section gets its own sets (A/B/C…) linked via sectionId. */}
            <ExamSectionBuilder
              key={sectionsKey}
              examId={exam!.id}
              courseId={exam!.courseId}
              onGenerated={loadExam}
            />
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-xs text-blue-800">
              <span className="font-semibold">Tip:</span> Use the <strong>Sections</strong> tab to configure and generate question sets per section.
              This tab shows the fine-grained question view for already-generated sets.
            </div>
            <ExamQuestionBuilder examId={exam!.id} exam={exam!} sets={exam!.sets || []} onRefresh={loadExam} />
          </div>
        );

      case 'folder-rules':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ExamSubjectBuilder examId={exam!.id} onGenerated={loadExam} />
          </div>
        );

      case 'blueprints':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <BlueprintPresetsPanel
              examId={exam!.id}
              courseId={exam!.courseId}
              onSectionsApplied={() => {
                setSectionsKey((k) => k + 1);
                setActiveTab('sections');
                toast({ title: 'Sections updated', description: 'Switch to the Sections tab to see the applied blueprint.', variant: 'success' });
              }}
            />
          </div>
        );

      case 'results':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ExamResultBatchesPanel examId={exam!.id} branchId={exam!.branchId} />
          </div>
        );

      case 'merit':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <MeritListsTab examId={exam!.id} />
          </div>
        );

      case 'leaderboard':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <ExamLeaderboard examId={exam!.id} showLeaderboard={exam!.showLeaderboard} courseOptions={leaderboardCourseOptions} />
          </div>
        );

      case 'evaluate':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <WrittenEvaluationPanel examId={exam!.id} teacherUserId="admin" />
          </div>
        );

      case 'omr':
        return showOmr ? <OmrTabPanel exam={exam!} onRefresh={loadExam} /> : null;

      case 'courses':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ExamCoursesPanel
              examId={exam!.id}
              primaryCourseId={exam!.courseId}
              primaryCourseName={exam!.course?.name}
              initialLinks={exam!.examCourses}
              onChanged={loadExam}
            />
          </div>
        );

      case 'analytics':
        return <ExamAnalyticsPanel examId={exam!.id} />;

      default:
        return null;
    }
  }

  return (
    <div className="space-y-4 text-slate-900">
      {/* ── Top breadcrumb bar ── */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="sm" asChild className="h-8 rounded-xl border-slate-200 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0">
            <Link href="/admin/exams">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Exams
            </Link>
          </Button>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          <h1 className="text-sm font-black text-slate-900 truncate">{exam.title}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={loadExam} className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Sidebar + content ── */}
      <div className="flex gap-5 items-start">
        <ExamSideNav
          exam={exam}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEdit={openEditWizard}
          onDelete={() => setShowDeleteDialog(true)}
          onTogglePublish={handleTogglePublish}
          publishing={publishing}
        />

        <div className="min-w-0 flex-1">
          {renderContent()}
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
        <AlertDialogContent className="rounded-[24px] border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently delete{' '}
              <span className="font-bold text-slate-700">"{exam.title}"</span> including all sets, questions, attempts, and results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm">
              {deleting ? 'Deleting…' : 'Delete Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// ─── Analytics Panel (kept inline to avoid extra file) ────────────────────────

function ExamAnalyticsPanel({ examId }: { examId: string }) {
  const [analytics, setAnalytics] = useState<import('@/lib/api/exams').ExamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await import('@/lib/api/exams').then((m) => m.getExamAnalytics(examId));
      if (res.success && res.data) setAnalytics(res.data);
      setLoading(false);
    })();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Loading analytics…</span>
      </div>
    );
  }

  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <p className="text-sm text-slate-500">No submitted attempts yet. Analytics appear after students complete the exam.</p>
      </div>
    );
  }

  const maxBucket = Math.max(...analytics.scoreDistribution.map((b) => b.count), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Attempts', value: analytics.totalAttempts },
          { label: 'Average Score', value: `${analytics.average}/${analytics.totalMarks}` },
          { label: 'Highest', value: analytics.highest, accent: 'text-emerald-600' },
          { label: 'Lowest', value: analytics.lowest, accent: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={cn('text-2xl font-black mt-1', s.accent ?? 'text-slate-800')}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Pass / Fail (40% threshold)</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-xl bg-emerald-50 px-4 py-4 text-center">
            <div className="text-2xl font-black text-emerald-700">{analytics.passFail.pass}</div>
            <div className="text-xs text-emerald-600">Passed ({analytics.passFail.passRate}%)</div>
          </div>
          <div className="flex-1 rounded-xl bg-rose-50 px-4 py-4 text-center">
            <div className="text-2xl font-black text-rose-700">{analytics.passFail.fail}</div>
            <div className="text-xs text-rose-600">Failed</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Score Distribution</h3>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {analytics.scoreDistribution.map((bucket) => (
            <div key={bucket.range} className="flex-1 flex flex-col items-center">
              <span className="text-[10px] text-slate-500 mb-1">{bucket.count}</span>
              <div className="w-full rounded-t bg-indigo-500 transition-all" style={{ height: `${Math.max(4, (bucket.count / maxBucket) * 140)}px` }} />
              <span className="mt-1 text-[9px] text-slate-400 whitespace-nowrap">{bucket.range}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Per-Question Accuracy</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">#</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="text-xs text-right">Answered</TableHead>
                <TableHead className="text-xs text-right">Correct</TableHead>
                <TableHead className="text-xs text-right">Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.perQuestionAccuracy.map((q, i) => (
                <TableRow key={q.questionId}>
                  <TableCell className="text-xs text-slate-500">{i + 1}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{q.type}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{q.text}</TableCell>
                  <TableCell className="text-xs text-right">{q.totalAnswered}</TableCell>
                  <TableCell className="text-xs text-right">{q.correctCount}</TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    <span className={q.accuracy >= 70 ? 'text-emerald-600' : q.accuracy >= 40 ? 'text-amber-600' : 'text-rose-600'}>
                      {q.accuracy}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
