import type { UiExamCategory, SectionTypeUi } from '../types';

export const EXAM_CATS: { id: UiExamCategory; icon: string; name: string; desc: string }[] = [
  { id: 'MCQ', icon: '📝', name: 'MCQ Exam', desc: 'Online / offline · auto-graded' },
  { id: 'CQ', icon: '✍️', name: 'CQ / Written', desc: 'Teacher evaluation · set-wise PDF' },
  { id: 'MCQCQ', icon: '📋', name: 'MCQ + Written', desc: 'Combined paper' },
  { id: 'MULTI', icon: '📚', name: 'Multi-subject', desc: 'Per-subject counts · pass marks' },
  { id: 'OMR', icon: '🔵', name: 'OMR sheet', desc: 'Scan pipeline' },
  { id: 'OMRB', icon: '📖', name: 'OMR book', desc: 'Book format · mobile scan' },
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
