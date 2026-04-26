import type { ExamMode, ExamType, SelectionMode } from '@/types/exam';

export type UiExamCategory = 'MCQ' | 'CQ' | 'MCQCQ' | 'MULTI' | 'OMR' | 'OMRB';

export type SectionTypeUi = 'MCQ' | 'CQ' | 'SHORT';

export interface FolderRuleDraft {
  folderId: string;
  folderName?: string;
  questionCount: number;
  selectionMode: SelectionMode;
  excludedQuestionIds: string[];
  pinnedQuestionIds: string[];
}

export interface WizardSection {
  localId: string;
  label: string;
  type: SectionTypeUi;
  count: number;
  marks: number;
  neg: number;
  difficulty: 'MIXED' | 'EASY' | 'MEDIUM' | 'HARD';
  folderRules: FolderRuleDraft[];
}

export interface WizardSubject {
  localId: string;
  name: string;
  count: number;
  marks: number;
  neg: number;
  passMarks: string;
  compulsory: boolean;
}

export interface ExamWizardState {
  step: number;
  uiCategory: UiExamCategory | '';
  deliveryMode: 'ONLINE' | 'OFFLINE';
  title: string;
  courseId: string;
  branchId: string;
  language: string;
  durationMinutes: string;
  instituteLabel: string;
  paperCode: string;
  scheduleAt: Date | undefined;
  solveAt: Date | undefined;
  scheduleTime: string;
  solveTime: string;
  sections: WizardSection[];
  subjects: WizardSubject[];
  nSets: string;
  shuffle: string;
  setNaming: 'ALPHA' | 'NUM' | 'KA';
  showLeaderboard: boolean;
  hideResult: boolean;
  showSolve: boolean;
  showPct: boolean;
  resultModes: string[];
}

export const WIZARD_STEPS = [
  'Category & info',
  'Sections',
  'Question bank',
  'Sets & PDF',
  'Result & SMS',
  'Preview',
] as const;

export function mapUiCategoryToExamType(cat: UiExamCategory): ExamType {
  switch (cat) {
    case 'OMR':
    case 'OMRB':
      return 'MODEL';
    case 'CQ':
      return 'MODEL';
    case 'MULTI':
      return 'MODEL';
    case 'MCQCQ':
      return 'MODEL';
    default:
      return 'MODEL';
  }
}

export function mapDeliveryToExamMode(m: 'ONLINE' | 'OFFLINE'): ExamMode {
  return m === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
}
