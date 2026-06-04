import type { Exam, ExamStudentView, StudentExamResultStatus } from '@/types/exam';
import { isOfflineDeliveryExam } from '@/lib/exam-workflow';

export type StudentExamPhase =
  | 'UPCOMING'
  | 'LIVE_ONLINE'
  | 'OFFLINE_SCHEDULED'
  | 'OFFLINE_DAY'
  | 'SUBMITTED'
  | 'RESULT_PENDING_BRANCH'
  | 'RESULT_PENDING_CENTRAL'
  | 'RESULT_PUBLISHED'
  | 'MISSED';

type ExamLike = Pick<
  Exam | ExamStudentView,
  'mode' | 'startAt' | 'endAt' | 'resultStatus' | 'examWorkflow'
> & {
  canAttempt?: boolean;
  hasInProgress?: boolean;
  hasInProgressAttempt?: boolean;
  latestCompletedAttemptId?: string | null;
};

export function offlineResultStatusLabel(status?: StudentExamResultStatus | null): string | null {
  switch (status) {
    case 'PUBLISHED':
      return 'Result published';
    case 'PENDING_CENTRAL_APPROVAL':
      return 'Branch approved - central approval pending';
    case 'PENDING_BRANCH_APPROVAL':
      return 'Result submitted - branch approval pending';
    case 'LEGACY_RESULT':
      return 'Result available';
    default:
      return null;
  }
}

export function resolveStudentExamPhase(exam: ExamLike): StudentExamPhase {
  if (exam.resultStatus === 'PUBLISHED' || exam.resultStatus === 'LEGACY_RESULT') return 'RESULT_PUBLISHED';
  if (exam.resultStatus === 'PENDING_CENTRAL_APPROVAL') return 'RESULT_PENDING_CENTRAL';
  if (exam.resultStatus === 'PENDING_BRANCH_APPROVAL') return 'RESULT_PENDING_BRANCH';
  if (exam.latestCompletedAttemptId) return 'SUBMITTED';

  const now = Date.now();
  const start = exam.startAt ? new Date(exam.startAt).getTime() : null;
  const end = exam.endAt ? new Date(exam.endAt).getTime() : null;
  if (start && now < start) return 'UPCOMING';
  if (end && now > end) return exam.resultStatus === 'NOT_SUBMITTED' ? 'MISSED' : 'SUBMITTED';

  if (isOfflineDeliveryExam(exam as Exam)) return start ? 'OFFLINE_DAY' : 'OFFLINE_SCHEDULED';
  return 'LIVE_ONLINE';
}

export function offlineInstructionsCta() {
  return 'Offline instructions';
}

export function centreQuestionPaperCopy() {
  return 'Question paper will be provided at the exam centre.';
}
