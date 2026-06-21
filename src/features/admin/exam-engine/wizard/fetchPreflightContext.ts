import { getExamAudienceStats } from '@/lib/api/exams';
import type { PreflightContext } from './validateWizardStep';
import type { ExamWizardState } from '../types';
import { resolveWizardBatchIdForApi, resolveWizardBranchIdForApi } from './constants';

/** Loads SMS audience counts for wizard preflight warnings. */
export async function fetchPreflightContext(state: ExamWizardState): Promise<PreflightContext> {
  if (!state.courseId || !state.smsNotification) return {};
  try {
    const res = await getExamAudienceStats({
      courseId: state.courseId,
      branchId: resolveWizardBranchIdForApi(state.branchId),
      batchId: resolveWizardBatchIdForApi(state.batchId),
      scope: state.scope,
    });
    if (!res.success || !res.data) return {};
    return {
      totalLinkedStudents: res.data.totalLinkedStudents,
      studentsWithMobile: res.data.studentsWithMobile,
    };
  } catch {
    return {};
  }
}
