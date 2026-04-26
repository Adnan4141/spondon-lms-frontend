import type { FolderTreeNode } from '@/lib/api/question-bank';
import type { ExamWizardState, UiExamCategory, WizardSection } from '../types';

export function newLocalId() {
  return `w_${Math.random().toString(36).slice(2, 11)}`;
}

export function defaultSectionsFor(cat: UiExamCategory): WizardSection[] {
  if (cat === 'CQ')
    return [
      {
        localId: newLocalId(),
        type: 'CQ',
        label: 'CQ — written',
        count: 8,
        marks: 10,
        neg: 0,
        difficulty: 'MIXED',
        folderRules: [],
      },
    ];
  if (cat === 'MCQCQ')
    return [
      {
        localId: newLocalId(),
        type: 'MCQ',
        label: 'MCQ',
        count: 30,
        marks: 1,
        neg: 0.25,
        difficulty: 'MIXED',
        folderRules: [],
      },
      {
        localId: newLocalId(),
        type: 'CQ',
        label: 'CQ',
        count: 8,
        marks: 10,
        neg: 0,
        difficulty: 'MIXED',
        folderRules: [],
      },
    ];
  if (cat === 'MULTI' || cat === 'OMR' || cat === 'OMRB') return [];
  return [
    {
      localId: newLocalId(),
      type: 'MCQ',
      label: 'MCQ',
      count: 25,
      marks: 1,
      neg: 0.25,
      difficulty: 'MIXED',
      folderRules: [],
    },
  ];
}

export function flattenFolders(
  nodes: FolderTreeNode[],
  prefix: string[] = [],
): { id: string; path: string; q: number }[] {
  const out: { id: string; path: string; q: number }[] = [];
  for (const n of nodes) {
    const p = [...prefix, n.name];
    if (n.children?.length) out.push(...flattenFolders(n.children, p));
    else out.push({ id: n.id, path: p.join(' › '), q: n.questionCount ?? n.counts?.total ?? 0 });
  }
  return out;
}

export function sectionAllocatedTotal(s: WizardSection): number {
  return s.folderRules.reduce((acc, r) => acc + r.questionCount, 0);
}

export function parseStepParam(raw: string | null): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(6, Math.max(1, n));
}

const KA = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

export function setLabelsForPreview(setNaming: ExamWizardState['setNaming'], nSets: number): string[] {
  const n = Math.max(1, Math.min(26, nSets || 1));
  if (setNaming === 'NUM') return Array.from({ length: n }, (_, i) => String(i + 1));
  if (setNaming === 'KA') return Array.from({ length: n }, (_, i) => KA[i] ?? `সেট ${i + 1}`);
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
}

export const WIZARD_FORM_INITIAL: ExamWizardState = {
  step: 1,
  uiCategory: '',
  deliveryMode: 'ONLINE',
  title: '',
  courseId: '',
  branchId: '',
  language: 'bn',
  durationMinutes: '60',
  instituteLabel: '',
  paperCode: '',
  scheduleAt: undefined,
  solveAt: undefined,
  scheduleTime: '09:00',
  solveTime: '17:00',
  sections: [],
  subjects: [],
  nSets: '4',
  shuffle: 'FULL',
  setNaming: 'ALPHA',
  showLeaderboard: true,
  hideResult: false,
  showSolve: true,
  showPct: false,
  resultModes: ['AUTO'],
};

/** Strip non-serializable / normalize for JSON storage */
export function serializeWizardForm(s: ExamWizardState): string {
  return JSON.stringify({
    ...s,
    scheduleAt: s.scheduleAt?.toISOString() ?? null,
    solveAt: s.solveAt?.toISOString() ?? null,
  });
}

export function deserializeWizardForm(json: string): ExamWizardState | null {
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    const base = { ...WIZARD_FORM_INITIAL, ...o } as ExamWizardState;
    if (o.scheduleAt && typeof o.scheduleAt === 'string') base.scheduleAt = new Date(o.scheduleAt);
    if (o.solveAt && typeof o.solveAt === 'string') base.solveAt = new Date(o.solveAt);
    return base;
  } catch {
    return null;
  }
}

export function draftStorageKey(examId?: string) {
  return `exam-wizard-draft:${examId ?? 'new'}`;
}
