import type { ExamProductType, SectionTypeUi } from '../types';

/** Select value for branchless exams → saved as `branchId: null` on the server */
export const EXAM_WIZARD_ALL_BRANCHES = '__all__';

/** Maps wizard branch select to API payload — never send the `__all__` sentinel. */
export function resolveWizardBranchIdForApi(branchId: string | undefined | null): string | undefined {
  if (!branchId || branchId === EXAM_WIZARD_ALL_BRANCHES) return undefined;
  return branchId;
}

export const EXAM_PRODUCT_TYPES: { id: ExamProductType; name: string; desc: string; bestFor: string }[] = [
  {
    id: 'MCQ',
    name: 'MCQ',
    desc: 'Single MCQ + passage-based combined MCQ. Auto-graded online, or printable for OMR / paper.',
    bestFor: 'Random from bank',
  },
  {
    id: 'WRITTEN',
    name: 'Written (CQ / Short)',
    desc: 'Creative-question and/or short-answer sets. Multiple sets, teacher-reviewed marks.',
    bestFor: 'Teacher review',
  },
  {
    id: 'COMBINED',
    name: 'MCQ + Written',
    desc: 'One exam, two parts. MCQ auto-graded; CQ/Short reviewed by teachers, then merged into one result.',
    bestFor: 'Hybrid model test',
  },
  {
    id: 'MULTI',
    name: 'Multi-subject MCQ',
    desc: 'Per-subject question counts, pass marks, optional/compulsory subjects. Admission / model-test style.',
    bestFor: 'Admission model',
  },
];

export const SEC_TYPES: {
  id: SectionTypeUi;
  label: string;
  color: string;
  short: string;
  dm: number;
  dn: number;
}[] = [
  { id: 'MCQ', label: 'MCQ', color: '#1565C0', short: 'MCQ', dm: 1, dn: 0.25 },
  { id: 'CQ', label: 'CQ', color: '#2E7D32', short: 'CQ', dm: 10, dn: 0 },
  { id: 'SHORT', label: 'Short answer', color: '#E65100', short: 'SAQ', dm: 2, dn: 0 },
];
