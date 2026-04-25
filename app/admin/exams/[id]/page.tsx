'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getExamById, deleteExam } from '@/lib/api/exams';
import type { Exam, ExamStatus } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ExamCreatorWizard } from '../ExamCreatorWizard';
import { ExamDetailsView } from '../ExamDetailsView';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusConfig(status: ExamStatus) {
  switch (status) {
    case 'PUBLISHED':
      return {
        label: 'Published',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
      };
    case 'CLOSED':
      return {
        label: 'Closed',
        class: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: XCircle,
      };
    default:
      return {
        label: 'Draft',
        class: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: Clock3,
      };
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl bg-slate-100" />
          <div className="h-5 w-px bg-slate-200" />
          <div className="h-6 w-64 rounded-lg bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-100" />
          <div className="h-9 w-28 rounded-xl bg-slate-100" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="h-[500px] rounded-[24px] bg-slate-100" />
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ─── Load exam ────────────────────────────────────────────────────────────

  const loadExam = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getExamById(examId);
      if (res.success && res.data) {
        setExam(res.data);
      } else {
        setError(res.message || 'Exam not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exam.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // ─── Edit via wizard ──────────────────────────────────────────────────────

  const openEditWizard = () => {
    if (!exam) return;
    openModal({
      title: 'Edit Exam',
      description: 'Update exam configuration using the step-by-step builder.',
      className: 'sm:max-w-6xl h-[94vh]',
      content: (
        <ExamCreatorWizard
          exam={exam}
          onSuccess={async () => {
            await loadExam();
            closeModal();
          }}
          onClose={closeModal}
        />
      ),
    });
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

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

  // ─── Loading / Error states ───────────────────────────────────────────────

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
          <Button
            variant="outline"
            onClick={loadExam}
            className="h-9 rounded-xl border-slate-200 text-sm font-bold"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Retry
          </Button>
          <Button
            asChild
            className="h-9 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-indigo-600"
          >
            <Link href="/admin/exams">Back to Exams</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusCfg = getStatusConfig(exam.status);
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5 text-slate-900">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-3.5 rounded-[20px] border border-slate-200/60 shadow-sm">
        {/* Left: Back + title + status */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 rounded-xl border-slate-200 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0"
          >
            <Link href="/admin/exams">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Exams
            </Link>
          </Button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-base font-black text-slate-900 truncate">{exam.title}</h1>
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide border px-2 py-1 shrink-0',
                statusCfg.class,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </Badge>
            {exam.examEngine && exam.examEngine !== 'REGULAR' && (
              <span className="text-[10px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 shrink-0">
                {exam.examEngine.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadExam}
            className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openEditWizard}
            className="h-8 rounded-xl border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* ── Exam Meta Strip ── */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {[
          exam.mode && { label: exam.mode, variant: 'mode' as const },
          exam.type && { label: exam.type.replace('_', ' '), variant: 'type' as const },
          exam.course && { label: exam.course.name, variant: 'course' as const },
          exam.durationMinutes && { label: `${exam.durationMinutes} min`, variant: 'duration' as const },
          exam.language && { label: exam.language === 'bn' ? 'বাংলা' : 'English', variant: 'lang' as const },
        ]
          .filter(Boolean)
          .map((meta: any, i) => (
            <span
              key={i}
              className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wide"
            >
              {meta.label}
            </span>
          ))}
        {exam.startAt && (
          <span className="text-xs font-medium text-slate-400">
            {new Date(exam.startAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {exam.endAt && (
              <>
                {' → '}
                {new Date(exam.endAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </>
            )}
          </span>
        )}
      </div>

      {/* ── ExamDetailsView ── */}
      <ExamDetailsView exam={exam} />

      {/* ── Delete Confirm ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
        <AlertDialogContent className="rounded-[24px] border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently delete{' '}
              <span className="font-bold text-slate-700">"{exam.title}"</span> including all sets,
              questions, attempts, and results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm"
            >
              {deleting ? 'Deleting...' : 'Delete Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
