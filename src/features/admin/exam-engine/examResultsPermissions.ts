/**
 * Client-side mirror of backend exam results capabilities.
 */

export const EXAM_RESULTS_CAPABILITIES = [
  'exam.results.view',
  'exam.results.offline.enter',
  'exam.results.offline.approve_branch',
  'exam.results.offline.approve_central',
  'exam.results.offline.reject',
  'exam.results.offline.delete',
  'exam.results.omr.upload',
  'exam.results.omr.review',
  'exam.results.omr.finalize',
  'exam.results.written.evaluate',
  'exam.results.written.finalize',
  'exam.results.sms.send',
  'exam.results.merit.export',
] as const;

export type ExamResultsCapability = (typeof EXAM_RESULTS_CAPABILITIES)[number];

const ROLE_CAPABILITIES: Record<string, ExamResultsCapability[]> = {
  SUPER_ADMIN: [...EXAM_RESULTS_CAPABILITIES],
  BRANCH_ADMIN: [
    'exam.results.view',
    'exam.results.offline.enter',
    'exam.results.offline.approve_branch',
    'exam.results.offline.reject',
    'exam.results.offline.delete',
    'exam.results.omr.upload',
    'exam.results.omr.review',
    'exam.results.omr.finalize',
    'exam.results.sms.send',
    'exam.results.merit.export',
  ],
  TEACHER: [
    'exam.results.view',
    'exam.results.written.evaluate',
    'exam.results.written.finalize',
  ],
  ACCOUNTS: ['exam.results.view', 'exam.results.merit.export'],
  MODERATOR: ['exam.results.view', 'exam.results.merit.export'],
};

export function canExamResults(
  role: string | null | undefined,
  capability: ExamResultsCapability,
): boolean {
  if (!role) return false;
  return (ROLE_CAPABILITIES[role] ?? []).includes(capability);
}

export function isTeacherEvaluatorRole(role: string | null | undefined): boolean {
  return role === 'TEACHER';
}

export function isOrgWideResultsRole(role: string | null | undefined): boolean {
  return role === 'SUPER_ADMIN';
}
