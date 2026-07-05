'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getExamById } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';
import { ExamEngineSubnav } from '../components/ExamEngineSubnav';
import { examBasePath, examListPath, type ExamPortal } from '../exam-portal-paths';
import { examWorkspaceHeaderClass, examWorkspaceMainClass } from './examWorkspaceUi';

type ExamWorkspaceContextValue = {
  exam: Exam | null;
  examId: string;
  loadingExam: boolean;
  refreshExam: () => Promise<void>;
};

const ExamWorkspaceContext = createContext<ExamWorkspaceContextValue | null>(null);

export function useExamWorkspace() {
  const ctx = useContext(ExamWorkspaceContext);
  if (!ctx) {
    throw new Error('useExamWorkspace must be used within ExamWorkspaceShell');
  }
  return ctx;
}

export function useExamWorkspaceOptional() {
  return useContext(ExamWorkspaceContext);
}

type ExamWorkspaceShellProps = {
  examId: string;
  children: ReactNode;
  portal?: ExamPortal;
  teacherUserId?: string;
  /** Hide subnav (e.g. teacher evaluator-only results). */
  hideSubnav?: boolean;
  /** Custom back link instead of hub / command center. */
  backHref?: string;
  backLabel?: string;
};

export function ExamWorkspaceShell({
  examId,
  children,
  portal = 'admin',
  teacherUserId,
  hideSubnav = false,
  backHref: backHrefOverride,
  backLabel: backLabelOverride,
}: ExamWorkspaceShellProps) {
  const pathname = usePathname() || '';
  const [exam, setExam] = useState<Exam | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);

  const refreshExam = useCallback(async () => {
    if (!examId) return;
    const response = await getExamById(
      examId,
      portal === 'teacher' && teacherUserId ? { teacherUserId } : undefined,
    );
    if (response.success && response.data) setExam(response.data);
    else setExam(null);
  }, [examId, portal, teacherUserId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingExam(true);
    void refreshExam().finally(() => {
      if (!cancelled) setLoadingExam(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshExam]);

  const base = examBasePath(portal, examId);
  const isOverview = pathname === base || pathname === `${base}/`;
  const { backHref, backLabel } = useMemo(() => {
    if (backHrefOverride) {
      return { backHref: backHrefOverride, backLabel: backLabelOverride ?? 'Back' };
    }
    if (isOverview) {
      return { backHref: examListPath(portal), backLabel: portal === 'teacher' ? 'My exams' : 'Exams' };
    }
    return { backHref: base, backLabel: 'Command center' };
  }, [backHrefOverride, backLabelOverride, base, isOverview, portal]);

  const ctx = useMemo(
    () => ({ exam, examId, loadingExam, refreshExam }),
    [exam, examId, loadingExam, refreshExam],
  );

  return (
    <ExamWorkspaceContext.Provider value={ctx}>
      <div className="min-h-screen bg-[#F4F6FB]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className={cn(examWorkspaceHeaderClass, 'space-y-3 py-3')}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" asChild className="gap-1 text-slate-600">
                <Link href={backHref}>
                  <ChevronLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
              <div className="hidden h-5 w-px bg-slate-200 sm:block" />
              <div className="min-w-0 flex-1">
                {loadingExam ? (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading exam…
                  </span>
                ) : exam ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate font-serif text-base font-normal text-[#0D1B35] sm:text-lg">
                      {exam.title}
                    </h1>
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                      {exam.status}
                    </Badge>
                    <span className="hidden text-xs text-slate-500 sm:inline">
                      {exam.mode}
                      {exam.course?.name ? ` · ${exam.course.name}` : ''}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Exam workspace</p>
                )}
              </div>
            </div>
            {!hideSubnav && examId ? <ExamEngineSubnav examId={examId} portal={portal} /> : null}
          </div>
        </header>
        <main className={examWorkspaceMainClass}>{children}</main>
      </div>
    </ExamWorkspaceContext.Provider>
  );
}
