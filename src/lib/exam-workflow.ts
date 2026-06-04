import type { Exam, ExamMode, ResultInputMode } from '@/types/exam';

export type ExamDeliveryMode = 'ONLINE' | 'OFFLINE';
export type ExamEvaluationMode = 'AGGREGATE' | 'SCRIPT_UPLOAD';

export type ResolvedExamWorkflow = {
  deliveryMode: ExamDeliveryMode;
  resultInputModes: ResultInputMode[];
  evaluationMode: ExamEvaluationMode;
  officialResultPipeline: 'RESULT_BATCH';
  isHallExam: boolean;
  supportsOfflineResults: boolean;
  supportsOmrScan: boolean;
  supportsWrittenEvaluation: boolean;
};

const OFFICIAL_OFFLINE_MODES = new Set<ResultInputMode>([
  'SINGLE_MANUAL',
  'BULK_MANUAL',
  'BULK_EXCEL',
  'OMR_SCAN',
]);

type WorkflowSource = Pick<Exam, 'mode' | 'settings' | 'resultInputModes'>;

function workflowOf(exam: WorkflowSource | null): Record<string, unknown> {
  const settings = exam?.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
  const workflow = (settings as Record<string, unknown>).examWorkflow;
  return workflow && typeof workflow === 'object' && !Array.isArray(workflow)
    ? workflow as Record<string, unknown>
    : {};
}

export function resolveExamWorkflow(exam: WorkflowSource | null): ResolvedExamWorkflow | null {
  if (!exam) return null;
  const workflow = workflowOf(exam);
  const deliveryMode: ExamDeliveryMode =
    workflow.deliveryMode === 'OFFLINE' || exam.mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
  const workflowModes = Array.isArray(workflow.resultInputModes)
    ? workflow.resultInputModes.filter((m): m is ResultInputMode => typeof m === 'string')
    : [];
  const resultInputModes = exam.resultInputModes?.length ? exam.resultInputModes : workflowModes;
  const evaluationMode: ExamEvaluationMode = workflow.evaluationMode === 'SCRIPT_UPLOAD' ? 'SCRIPT_UPLOAD' : 'AGGREGATE';
  const supportsOmrScan = resultInputModes.includes('OMR_SCAN');
  const supportsOfflineResults =
    deliveryMode === 'OFFLINE'
    || resultInputModes.some((mode) => OFFICIAL_OFFLINE_MODES.has(mode));
  const supportsWrittenEvaluation =
    deliveryMode === 'ONLINE'
      ? ['WRITTEN', 'HYBRID', 'OFFLINE'].includes(exam.mode as ExamMode)
      : evaluationMode === 'SCRIPT_UPLOAD';

  return {
    deliveryMode,
    resultInputModes,
    evaluationMode,
    officialResultPipeline: 'RESULT_BATCH',
    isHallExam: deliveryMode === 'OFFLINE',
    supportsOfflineResults,
    supportsOmrScan,
    supportsWrittenEvaluation,
  };
}

export function isOfflineDeliveryExam(exam: WorkflowSource | null): boolean {
  return resolveExamWorkflow(exam)?.deliveryMode === 'OFFLINE';
}
