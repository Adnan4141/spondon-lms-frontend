import type { CqPartMeta, WrittenAttemptDetail, WrittenAttemptRow } from './types';

export type AttemptDisplayStatus = 'pending' | 'in_progress' | 'ready' | 'finalized';

export function readCqParts(meta: unknown): CqPartMeta[] {
  if (!meta || typeof meta !== 'object') return [];
  const parts = (meta as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return [];
  return parts.filter(
    (part): part is CqPartMeta =>
      Boolean(part && typeof part === 'object' && typeof (part as CqPartMeta).label === 'string'),
  );
}

export function isReadyToFinalize(attempt: WrittenAttemptRow): boolean {
  return attempt.obtainedMarks == null && attempt.evaluationStatus !== 'PENDING';
}

export function getAttemptDisplayStatus(attempt: WrittenAttemptRow): AttemptDisplayStatus {
  if (attempt.obtainedMarks != null) return 'finalized';
  if (attempt.evaluationStatus === 'PENDING' || !attempt.evaluationStatus) return 'pending';
  if (attempt.evaluationStatus === 'PARTIAL') return 'in_progress';
  if (isReadyToFinalize(attempt)) return 'ready';
  return 'pending';
}

export const ATTEMPT_STATUS_META: Record<
  AttemptDisplayStatus,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'In progress', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  ready: { label: 'Ready to finalize', className: 'bg-amber-50 text-amber-900 border-amber-200' },
  finalized: { label: 'Finalized', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

export function countAttemptsByStatus(attempts: WrittenAttemptRow[]) {
  const counts = { pending: 0, in_progress: 0, ready: 0, finalized: 0 };
  for (const attempt of attempts) {
    counts[getAttemptDisplayStatus(attempt)] += 1;
  }
  return counts;
}

export function isMarkInvalid(value: string, maxMarks: number): boolean {
  if (value.trim() === '') return false;
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed < 0 || parsed > maxMarks;
}

export function marksDraftKey(answerId: string, subPartKey?: string) {
  return subPartKey ? `${answerId}:${subPartKey}` : answerId;
}

/** Matches student result numbering: position within the student's assigned set. */
export function questionDisplayNumber(question: { orderIndex?: number }, arrayIndex: number): number {
  if (typeof question.orderIndex === 'number' && Number.isFinite(question.orderIndex)) {
    return question.orderIndex + 1;
  }
  return arrayIndex + 1;
}

export function buildMarksBaselineFromAttempt(attempt: WrittenAttemptDetail | null): Record<string, string> {
  const baseline: Record<string, string> = {};
  if (!attempt) return baseline;
  for (const question of attempt.questions || []) {
    const answer = question.studentAnswer;
    if (!answer?.id) continue;
    const parts = readCqParts(question.question?.meta);
    if (parts.length) {
      for (const part of parts) {
        const evaluation = (answer.evaluations || []).find((ev) => ev.subPartKey === part.label);
        if (evaluation?.marksAwarded != null) {
          baseline[marksDraftKey(answer.id, part.label)] = String(evaluation.marksAwarded);
        }
      }
    } else if (answer.obtainedMarks != null) {
      baseline[answer.id] = String(answer.obtainedMarks);
    }
  }
  return baseline;
}

export function hasUnsavedMarksChanges(
  draft: Record<string, string>,
  baseline: Record<string, string>,
): boolean {
  const keys = new Set([...Object.keys(draft), ...Object.keys(baseline)]);
  for (const key of keys) {
    if ((draft[key] ?? '') !== (baseline[key] ?? '')) return true;
  }
  return false;
}

export function isMarkingComplete(attempt: WrittenAttemptDetail | null): boolean {
  if (!attempt) return false;
  let hasGradableAnswer = false;
  for (const question of attempt.questions || []) {
    const answer = question.studentAnswer;
    if (!answer?.id) continue;
    hasGradableAnswer = true;
    const parts = readCqParts(question.question?.meta);
    if (parts.length) {
      for (const part of parts) {
        const evaluation = (answer.evaluations || []).find((ev) => ev.subPartKey === part.label);
        if (evaluation?.marksAwarded == null) return false;
      }
    } else if (answer.obtainedMarks == null) {
      return false;
    }
  }
  return hasGradableAnswer;
}

export function getFirstPreviewUrlForQuestion(
  question: NonNullable<WrittenAttemptDetail['questions']>[number],
): string | null {
  const answer = question.studentAnswer;
  if (!answer) return null;
  const firstPage = answer.writtenSubmission?.pages?.[0]?.url;
  if (firstPage) return firstPage;
  return answer.writtenSubmission?.finalPdfUrl ?? null;
}
