import type { Exam } from '@/types/exam';
import type { ExamWizardState } from '@/features/admin/exam-engine/types';
import { resolveExamWorkflow } from '@/lib/exam-workflow';

/** Mirrors backend `needsGeneratedQuestionSets` in exam-publish-readiness.ts */
export function needsGeneratedQuestionSets(exam: Exam): boolean {
  const modes = exam.resultInputModes ?? [];
  const workflow = resolveExamWorkflow(exam);
  if (modes.includes('AUTOMATED') || modes.includes('OMR_SCAN')) return true;
  if (workflow.deliveryMode === 'ONLINE' && !workflow.isHallExam) return true;
  return false;
}

export function hasGeneratedSets(exam: Exam): boolean {
  const count = exam._count?.sets ?? exam.sets?.length ?? 0;
  return count > 0;
}

export function examNeedsAction(exam: Exam): boolean {
  if (exam.status === 'DRAFT') return true;
  if (!needsGeneratedQuestionSets(exam)) return false;
  if (!hasGeneratedSets(exam)) return true;
  if (!exam.pdfUrl) return true;
  return false;
}

export function examReadinessLabel(exam: Exam): { label: string; tone: string } {
  if (!needsGeneratedQuestionSets(exam)) {
    if (exam.status === 'DRAFT') {
      return { label: 'Draft', tone: 'border-amber-200 bg-amber-50 text-amber-800' };
    }
    return { label: 'Ready', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  }
  if (!hasGeneratedSets(exam)) {
    return { label: 'Needs sets', tone: 'border-amber-200 bg-amber-50 text-amber-800' };
  }
  if (!exam.pdfUrl) {
    return { label: 'PDF needed', tone: 'border-amber-200 bg-amber-50 text-amber-800' };
  }
  return { label: 'Ready', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
}

export type WizardPublishMeta = {
  setCount?: number;
  pdfUrl?: string | null;
  solveSheetUrl?: string | null;
};

/** Whether the wizard config requires generated question sets before publish. */
export function wizardNeedsGeneratedSets(
  state: Pick<ExamWizardState, 'resultInputModes' | 'deliveryMode'>,
): boolean {
  const modes = state.resultInputModes ?? [];
  if (modes.includes('AUTOMATED') || modes.includes('OMR_SCAN')) return true;
  if (state.deliveryMode === 'ONLINE') return true;
  return false;
}

/** Client-side publish checklist mirroring backend `assessPublishReadinessFromExam`. */
export function assessWizardPublishReadiness(
  state: ExamWizardState,
  meta: WizardPublishMeta,
): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!state.title.trim()) blockers.push('Exam title is required.');
  if (!state.courseId) blockers.push('Link a course before publishing.');

  if (wizardNeedsGeneratedSets(state)) {
    if (!meta.setCount) {
      blockers.push('Generate question sets before publishing (save & pull questions from the bank in the wizard).');
    } else if (!meta.pdfUrl) {
      blockers.push('Generate the master question paper PDF before publishing.');
    }
  }

  if (state.resultInputModes.includes('OMR_SCAN')) {
    if (!state.omrConfig?.questionCount || !state.omrConfig?.optionCount) {
      blockers.push('Configure the OMR sheet (question count and option count) before publishing.');
    }
  }

  if (state.startAt && state.endAt && state.startAt.getTime() >= state.endAt.getTime()) {
    blockers.push('Start time must be before end time.');
  }

  if (state.showSolve && wizardNeedsGeneratedSets(state) && !meta.solveSheetUrl) {
    warnings.push('Solve sheet is enabled but not generated — students may not see solutions until you generate it.');
  }

  if (state.endAt && state.endAt.getTime() < Date.now()) {
    warnings.push('End time is in the past — students may not be able to attempt.');
  }

  return { ok: blockers.length === 0, blockers, warnings };
}
