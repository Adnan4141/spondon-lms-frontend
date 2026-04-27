import type { ExamWizardState } from '../types';

export type Step1FieldKey = 'uiCategory' | 'title' | 'courseId';

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
    };
    const ok = !step1Fields.uiCategory && !step1Fields.title && !step1Fields.courseId;
    if (ok) return { ok: true };
    const parts: string[] = [];
    if (step1Fields.uiCategory) parts.push('exam category');
    if (step1Fields.title) parts.push('title (min 3 characters)');
    if (step1Fields.courseId) parts.push('course');
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
    for (const s of state.sections) {
      const n = Number(s.count);
      if (!Number.isFinite(n) || n < 1) {
        return { ok: false, summary: `Section "${s.label || s.type}" needs at least 1 question slot.` };
      }
      if (n > 500) {
        return { ok: false, summary: `Section "${s.label || s.type}" exceeds the 500 slot limit.` };
      }
      if (s.type === 'MCQ') {
        const pg = Math.max(0, s.mcqPassageCount ?? 0);
        if (pg > 500) {
          return { ok: false, summary: `Section "${s.label || 'MCQ'}" has an invalid passage block count.` };
        }
        if (pg > n) {
          return {
            ok: false,
            summary: `Section "${s.label || 'MCQ'}": whole passage blocks (${pg}) cannot exceed total slots (${n}).`,
          };
        }
      }
    }
    return { ok: true };
  }
  return { ok: true };
}

export function canAdvance(state: ExamWizardState, step: number): boolean {
  return validateStep(state, step).ok;
}
