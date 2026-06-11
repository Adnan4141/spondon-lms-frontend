import type { FolderTreeNode } from '@/lib/api/question-bank';
import type { ExamProductType, ExamWizardState, WizardSection } from '../types';
import { EXAM_WIZARD_ALL_BRANCHES } from './constants';

export function newLocalId() {
  return `w_${Math.random().toString(36).slice(2, 11)}`;
}

export function defaultSectionsFor(productType: ExamProductType, defaultNeg = 0.25): WizardSection[] {
  if (productType === 'WRITTEN')
    return [
      {
        localId: newLocalId(),
        type: 'CQ',
        label: 'Creative / CQ',
        count: 8,
        marks: 10,
        neg: 0,
        difficulty: 'MIXED',
        folderRules: [],
      },
      {
        localId: newLocalId(),
        type: 'SHORT',
        label: 'Short answers',
        count: 10,
        marks: 2,
        neg: 0,
        difficulty: 'MIXED',
        folderRules: [],
      },
    ];
  if (productType === 'COMBINED')
    return [
      {
        localId: newLocalId(),
        type: 'MCQ',
        label: 'MCQ',
        count: 30,
        mcqPassageCount: 0,
        marks: 1,
        neg: defaultNeg,
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
  if (productType === 'MULTI') return [];
  return [
    {
      localId: newLocalId(),
      type: 'MCQ',
      label: 'MCQ',
      count: 25,
      mcqPassageCount: 0,
      marks: 1,
      neg: defaultNeg,
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
    out.push({ id: n.id, path: p.join(' › '), q: n.questionCount ?? n.counts?.total ?? 0 });
    if (n.children?.length) out.push(...flattenFolders(n.children, p));
  }
  return out;
}

export interface FolderCounts {
  mcqSingle: number;
  mcqPassage: number;
  cq: number;
  short: number;
  total: number;
}

/**
 * Sum the `counts.*` of a folder and all its descendants. The backend tree
 * only returns own-counts per node, so the wizard rolls them up client-side
 * to show meaningful totals on parent rows (e.g. "Physics → 45Q" even when
 * Physics has zero direct questions and 45 live under chapters).
 */
export function rollupFolderCounts(node: FolderTreeNode): FolderCounts {
  const own = node.counts ?? { mcqSingle: 0, mcqPassage: 0, cq: 0, short: 0, total: 0 };
  let total = own.total ?? 0;
  let mcqSingle = own.mcqSingle ?? 0;
  let mcqPassage = own.mcqPassage ?? 0;
  let cq = own.cq ?? 0;
  let short = own.short ?? 0;
  for (const child of node.children ?? []) {
    const childRollup = rollupFolderCounts(child);
    total += childRollup.total;
    mcqSingle += childRollup.mcqSingle;
    mcqPassage += childRollup.mcqPassage;
    cq += childRollup.cq;
    short += childRollup.short;
  }
  return { mcqSingle, mcqPassage, cq, short, total };
}

/** Build a `folderId → rollupCounts` map for an entire tree (memoise-friendly). */
export function buildRollupCountsMap(
  nodes: FolderTreeNode[],
  out: Map<string, FolderCounts> = new Map(),
): Map<string, FolderCounts> {
  for (const node of nodes) {
    out.set(node.id, rollupFolderCounts(node));
    if (node.children?.length) buildRollupCountsMap(node.children, out);
  }
  return out;
}

export function folderCapacityForType(
  counts: FolderCounts | undefined,
  type: 'MCQ' | 'CQ' | 'SHORT',
): number {
  if (!counts) return 0;
  if (type === 'MCQ') return counts.mcqSingle + counts.mcqPassage;
  if (type === 'CQ') return counts.cq;
  return counts.short;
}

export function sectionAllocatedTotal(s: WizardSection): number {
  return s.folderRules.reduce((acc, r) => acc + r.questionCount, 0);
}

/** MCQ passage block goal for UI / generator (0 = greedy). */
export function sectionMcqPassageGoal(s: WizardSection): number {
  if (s.type !== 'MCQ') return 0;
  return Math.max(0, Math.min(500, s.mcqPassageCount ?? 0));
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
  deliveryMode: 'ONLINE',
  productType: '',
  omrConfig: null,
  resultInputModes: ['AUTOMATED'],
  resultInputModesUserEdited: false,
  smsNotification: false,
  startAt: undefined,
  endAt: undefined,
  solveVisibility: 'IMMEDIATELY',
  solveScheduledAt: undefined,
  defaultNegativeMarks: 0.25,
  title: '',
  courseId: '',
  branchId: EXAM_WIZARD_ALL_BRANCHES,
  language: 'bn',
  durationMinutes: '60',
  allowedAttempts: '1',
  autoSubmitOnDisconnect: false,
  disconnectGraceSeconds: '10',
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
  resultModes: ['AUTOMATED'],
};

/** Strip non-serializable / normalize for JSON storage */
export function serializeWizardForm(s: ExamWizardState): string {
  return JSON.stringify({
    ...s,
    scheduleAt: s.scheduleAt?.toISOString() ?? null,
    solveAt: s.solveAt?.toISOString() ?? null,
    startAt: s.startAt?.toISOString() ?? null,
    endAt: s.endAt?.toISOString() ?? null,
    solveScheduledAt: s.solveScheduledAt?.toISOString() ?? null,
  });
}

export function deserializeWizardForm(json: string): ExamWizardState | null {
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    const base = { ...WIZARD_FORM_INITIAL, ...o } as ExamWizardState;
    // Migrate legacy courseIds[] → courseId string
    if (typeof base.courseId !== 'string' || !base.courseId) {
      const legacyArray = (o as Record<string, unknown>).courseIds;
      if (Array.isArray(legacyArray) && typeof legacyArray[0] === 'string') {
        base.courseId = legacyArray[0] as string;
      } else {
        base.courseId = '';
      }
    }
    if (base.deliveryMode !== 'ONLINE' && base.deliveryMode !== 'OFFLINE') {
      base.deliveryMode = 'ONLINE';
    }
    if (o.scheduleAt && typeof o.scheduleAt === 'string') base.scheduleAt = new Date(o.scheduleAt);
    if (o.solveAt && typeof o.solveAt === 'string') base.solveAt = new Date(o.solveAt);
    if (o.startAt && typeof o.startAt === 'string') base.startAt = new Date(o.startAt);
    if (o.endAt && typeof o.endAt === 'string') base.endAt = new Date(o.endAt);
    if (o.solveScheduledAt && typeof o.solveScheduledAt === 'string') {
      base.solveScheduledAt = new Date(o.solveScheduledAt);
    }
    if (!base.branchId) base.branchId = EXAM_WIZARD_ALL_BRANCHES;
    base.subjects = (base.subjects ?? []).map((sub) => ({
      ...sub,
      mcqSingleCount: Number(sub.mcqSingleCount ?? sub.count ?? 0),
      mcqPassageCount: Number(sub.mcqPassageCount ?? 0),
      cqCount: Number(sub.cqCount ?? 0),
      shortCount: Number(sub.shortCount ?? 0),
      folderRules: sub.folderRules ?? [],
    }));
    if (!Array.isArray(base.resultInputModes) || base.resultInputModes.length === 0) {
      base.resultInputModes = ['AUTOMATED'];
    }
    if (!base.solveVisibility) base.solveVisibility = 'IMMEDIATELY';
    if (typeof base.defaultNegativeMarks !== 'number') base.defaultNegativeMarks = 0.25;
    if (typeof base.smsNotification !== 'boolean') base.smsNotification = false;
    return base;
  } catch {
    return null;
  }
}

export function draftStorageKey(examId?: string, scope = 'new') {
  return `exam-wizard-draft:${examId ?? scope}`;
}
