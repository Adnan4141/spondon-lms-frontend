import type { UiExamCategory, SectionTypeUi } from '../types';

/** Select value for branchless exams → saved as `branchId: null` on the server */
export const EXAM_WIZARD_ALL_BRANCHES = '__all__';

export const EXAM_CATS: { id: UiExamCategory; name: string; desc: string; bestFor: string }[] = [
  { id: 'MCQ', name: 'Online MCQ', desc: 'Students answer inside LMS; system auto-grades instantly.', bestFor: 'Digital MCQ' },
  { id: 'CQ', name: 'Written Upload', desc: 'Students write by hand, upload camera/PDF pages, then teachers evaluate.', bestFor: 'CQ / Written' },
  { id: 'MCQCQ', name: 'Hybrid MCQ + Handwritten', desc: 'MCQ is auto-graded; written pages are uploaded for teacher marking.', bestFor: 'MCQ + CQ' },
  { id: 'OFFLINE_RESULT', name: 'Offline Result Entry', desc: 'Teachers mark physical scripts and input results manually or by bulk import.', bestFor: 'Classroom exam' },
  { id: 'OMR', name: 'OMR / Scan', desc: 'Paper exam with OMR-style scanning and result sync.', bestFor: 'Large MCQ hall exam' },
  { id: 'OMRB', name: 'OMR Book', desc: 'Book-format OMR workflow with printable/downloadable assets.', bestFor: 'Book format' },
  { id: 'MULTI', name: 'Multi-subject', desc: 'Per-subject question counts, pass marks, and folder allocation.', bestFor: 'Admission model' },
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
