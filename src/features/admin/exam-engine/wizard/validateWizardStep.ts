import type { ExamWizardState } from '../types';

export type Step1FieldKey = 'uiCategory' | 'title' | 'courseId' | 'branchId';

export type StepValidation = {
  ok: boolean;
  /** Human-readable summary when blocking Continue */
  summary?: string;
  /** Step 1 inline field flags */
  step1Fields?: Partial<Record<Step1FieldKey, boolean>>;
};

export function validateStep(state: ExamWizardState, step: number): StepValidation {
  if (step === 1) {
    const step1Fields: Partial<Record<Step1FieldKey, boolean>> = {
      uiCategory: !state.uiCategory,
      title: state.title.trim().length <= 2,
      courseId: !state.courseId,
      branchId: !state.branchId,
    };
    const ok = !step1Fields.uiCategory && !step1Fields.title && !step1Fields.courseId && !step1Fields.branchId;
    if (ok) return { ok: true };
    const parts: string[] = [];
    if (step1Fields.uiCategory) parts.push('exam category');
    if (step1Fields.title) parts.push('title (min 3 characters)');
    if (step1Fields.courseId) parts.push('course');
    if (step1Fields.branchId) parts.push('branch');
    return {
      ok: false,
      summary: `Please complete: ${parts.join(', ')}.`,
      step1Fields,
    };
  }
  if (step === 2) {
    if (state.uiCategory === 'MULTI') {
      if (state.subjects.length === 0) {
        return { ok: false, summary: 'Add at least one subject for multi-subject exams.' };
      }
      return { ok: true };
    }
    if (state.uiCategory === 'OMRB') return { ok: true };
    if (state.sections.length === 0) {
      return { ok: false, summary: 'Add at least one section.' };
    }
    return { ok: true };
  }
  return { ok: true };
}

export function canAdvance(state: ExamWizardState, step: number): boolean {
  return validateStep(state, step).ok;
}
