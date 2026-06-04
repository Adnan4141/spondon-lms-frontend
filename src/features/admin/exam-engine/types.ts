import type {
  ExamEngineType,
  ExamMode,
  ExamType,
  ResultInputMode,
  SelectionMode,
} from '@/types/exam';
import type { Course } from '@/types/course';

/**
 * Spec exam types (4). Replaces the previous 7-way `UiExamCategory` which
 * conflated type, mode, and result-entry method.
 *
 * Orthogonal axes are now: { productType, courseId, omrConfig?, resultInputModes[], smsNotification }.
 * Delivery mode is derived from the selected course's type in the wizard, then persisted
 * into settings.examWorkflow so runtime routing never has to guess from Exam.mode.
 */
export type ExamProductType = 'MCQ' | 'WRITTEN' | 'COMBINED' | 'MULTI';

/**
 * @deprecated Retained only for legacy migration in {@link migrateLegacyUiCategory}.
 * New code must use {@link ExamProductType} + the orthogonal axes on `ExamWizardState`.
 */
export type UiExamCategory = 'MCQ' | 'CQ' | 'MCQCQ' | 'MULTI' | 'OMR' | 'OMRB' | 'OFFLINE_RESULT';

export type SectionTypeUi = 'MCQ' | 'CQ' | 'SHORT';

/** Predefined OMR sheet sizes per Spondon public dynamic spec. */
export type OmrSheetSize = '30' | '50' | '100' | '120' | 'COMPETITIVE';

export interface OmrConfig {
  sheetSize: OmrSheetSize;
  questionCount: number;
  optionCount: 3 | 4 | 5;
}

export type SolveSheetVisibility = 'IMMEDIATELY' | 'HIDDEN' | 'SCHEDULED';

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
  /** Total question slots (MCQ/CQ/SHORT). For MCQ this is the generator cap (singles + passage MCQs). */
  count: number;
  /**
   * MCQ only: max number of whole passage blocks to include before filling with standalone MCQs.
   * 0 = greedy (pack as many passage blocks as fit within `count`).
   */
  mcqPassageCount?: number;
  marks: number;
  neg: number;
  difficulty: 'MIXED' | 'EASY' | 'MEDIUM' | 'HARD';
  folderRules: FolderRuleDraft[];
}

export interface WizardSubject {
  localId: string;
  name: string;
  count: number;
  mcqSingleCount: number;
  mcqPassageCount: number;
  cqCount: number;
  shortCount: number;
  marks: number;
  neg: number;
  passMarks: string;
  compulsory: boolean;
  folderRules: FolderRuleDraft[];
}

export interface ExamWizardState {
  step: number;

  /**
   * Exam product type axis.
   * Delivery mode is not stored in wizard state — derive it via {@link getEffectiveDeliveryMode}.
   */
  productType: ExamProductType | '';
  omrConfig: OmrConfig | null;
  resultInputModes: ResultInputMode[];
  /**
   * True once the admin has explicitly toggled a result-input mode. Suppresses
   * the smart-preset auto-fill that fires when Type or Course changes so we
   * never clobber an intentional pick. Cleared when the wizard is re-hydrated
   * from a saved exam (the saved selection counts as the user's intent).
   */
  resultInputModesUserEdited: boolean;
  smsNotification: boolean;
  startAt: Date | undefined;
  endAt: Date | undefined;
  solveVisibility: SolveSheetVisibility;
  solveScheduledAt: Date | undefined;
  defaultNegativeMarks: number;

  title: string;
  /** Single required course. Delivery mode is computed from this course's type. */
  courseId: string;
  branchId: string;
  language: string;
  durationMinutes: string;
  autoSubmitOnDisconnect: boolean;
  disconnectGraceSeconds: string;
  /** @deprecated retained for input by `BasicExamInfoForm` only; canonical sources are `startAt` and `solveScheduledAt`. */
  scheduleAt: Date | undefined;
  /** @deprecated retained for input by `BasicExamInfoForm` only; use `solveScheduledAt`. */
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
  /** @deprecated mirror of `resultInputModes` kept while presets stabilise. */
  resultModes: string[];
}

/**
 * Pure selector — never stored in state.
 * Returns the delivery mode of the selected course, defaulting to ONLINE
 * when the course list has not yet loaded or no course is selected.
 */
export function getEffectiveDeliveryMode(
  courseId: string,
  courses: Pick<Course, 'id' | 'type'>[],
): 'ONLINE' | 'OFFLINE' {
  return courses.find((c) => c.id === courseId)?.type ?? 'ONLINE';
}

export const WIZARD_STEPS = [
  'Basic & type',
  'Sections',
  'Question bank',
  'Sets & PDF',
  'Result & SMS',
  'Schedule & publish',
] as const;

const PRODUCT_TYPE_TO_EXAM_TYPE: Record<ExamProductType, ExamType> = {
  MCQ: 'MODEL',
  WRITTEN: 'MODEL',
  COMBINED: 'MODEL',
  MULTI: 'MODEL',
};

const PRODUCT_TYPE_TO_ENGINE: Partial<Record<ExamProductType, ExamEngineType>> = {
  MULTI: 'MULTI_SUBJECT',
};

export function mapProductTypeToExamType(t: ExamProductType): ExamType {
  return PRODUCT_TYPE_TO_EXAM_TYPE[t];
}

export function mapProductTypeToEngine(t: ExamProductType, isOmrBook: boolean): ExamEngineType | undefined {
  if (isOmrBook) return 'OMR_BOOK';
  return PRODUCT_TYPE_TO_ENGINE[t];
}

/**
 * Map type+mode to the persisted `ExamMode` column. WRITTEN/COMBINED always
 * persist as WRITTEN/HYBRID regardless of delivery — backend uses these to
 * route grading.
 */
export function mapToExamMode(productType: ExamProductType | '', mode: 'ONLINE' | 'OFFLINE'): ExamMode {
  if (productType === 'WRITTEN') return 'WRITTEN';
  if (productType === 'COMBINED') return 'HYBRID';
  return mode === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
}

/**
 * Migrate legacy `UiExamCategory` (and saved `Exam.mode`) to the new
 * orthogonal axes. Called from `buildWizardPatchFromExam` and from preset
 * hydration so saved drafts and blueprints continue to load.
 */
export function migrateLegacyUiCategory(
  legacy: UiExamCategory | '' | undefined,
  fallbackMode: ExamMode | undefined,
): {
  productType: ExamProductType | '';
  deliveryMode: 'ONLINE' | 'OFFLINE';
  resultInputModes: ResultInputMode[];
  isOmrBook: boolean;
} {
  switch (legacy) {
    case 'MCQ':
      return { productType: 'MCQ', deliveryMode: 'ONLINE', resultInputModes: ['AUTOMATED'], isOmrBook: false };
    case 'CQ':
      return {
        productType: 'WRITTEN',
        deliveryMode: fallbackMode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
        resultInputModes: ['AUTOMATED'],
        isOmrBook: false,
      };
    case 'MCQCQ':
      return { productType: 'COMBINED', deliveryMode: 'ONLINE', resultInputModes: ['AUTOMATED'], isOmrBook: false };
    case 'MULTI':
      return { productType: 'MULTI', deliveryMode: 'ONLINE', resultInputModes: ['AUTOMATED'], isOmrBook: false };
    case 'OFFLINE_RESULT':
      return {
        productType: 'MCQ',
        deliveryMode: 'OFFLINE',
        resultInputModes: ['SINGLE_MANUAL', 'BULK_MANUAL', 'BULK_EXCEL'],
        isOmrBook: false,
      };
    case 'OMR':
      return { productType: 'MCQ', deliveryMode: 'OFFLINE', resultInputModes: ['OMR_SCAN'], isOmrBook: false };
    case 'OMRB':
      return { productType: 'MCQ', deliveryMode: 'OFFLINE', resultInputModes: ['OMR_SCAN'], isOmrBook: true };
    default:
      return { productType: '', deliveryMode: 'ONLINE', resultInputModes: ['AUTOMATED'], isOmrBook: false };
  }
}

export const OMR_SHEET_PRESETS: Record<OmrSheetSize, { label: string; questionCount: number; optionCount: 3 | 4 | 5 }> = {
  '30': { label: '30 questions', questionCount: 30, optionCount: 4 },
  '50': { label: '50 questions', questionCount: 50, optionCount: 4 },
  '100': { label: '100 questions', questionCount: 100, optionCount: 4 },
  '120': { label: '120 questions', questionCount: 120, optionCount: 4 },
  COMPETITIVE: { label: 'Competitive (200, 5 options)', questionCount: 200, optionCount: 5 },
};

/** Default OMR sheet preset used when OMR scan is enabled without explicit config. */
export function defaultOmrConfig(): OmrConfig {
  const preset = OMR_SHEET_PRESETS['50'];
  return { sheetSize: '50', questionCount: preset.questionCount, optionCount: preset.optionCount };
}

/**
 * When OMR scan is selected for an offline exam, ensure `omrConfig` exists so
 * preflight and persistence can set `omrQuestionCount` / `omrOptionCount`.
 * `deliveryMode` is passed explicitly since it is no longer stored in state.
 */
export function resolveOmrConfigForState(
  state: Pick<ExamWizardState, 'resultInputModes' | 'omrConfig' | 'productType'>,
  deliveryMode: 'ONLINE' | 'OFFLINE',
): OmrConfig | null {
  if (!state.resultInputModes.includes('OMR_SCAN')) return state.omrConfig;
  if (state.omrConfig !== null) return state.omrConfig;
  if (deliveryMode !== 'OFFLINE') return null;
  if (state.productType === 'WRITTEN') return null;
  return defaultOmrConfig();
}

/**
 * Recommended `resultInputModes` per (productType, deliveryMode) combination.
 *
 * The wizard pre-checks these when the admin first picks a Type or toggles the
 * delivery mode, *only if* the user hasn't manually edited the field yet — we
 * never overwrite an explicit choice. Mirrors the policy:
 *
 *  - Online MCQ / Multi / Combined → automatic grading
 *  - Online Written → manual entry (per-student + bulk rows)
 *  - Offline MCQ / Multi → OMR scan with manual entry as backup
 *  - Offline Combined → OMR scan + Excel bulk (for the written section)
 *  - Offline Written → manual entry + Excel bulk
 */
export const SUGGESTED_RESULT_MODES: Record<
  Exclude<ExamProductType, never>,
  Record<'ONLINE' | 'OFFLINE', ResultInputMode[]>
> = {
  MCQ: {
    ONLINE: ['AUTOMATED'],
    OFFLINE: ['OMR_SCAN', 'SINGLE_MANUAL'],
  },
  WRITTEN: {
    ONLINE: ['SINGLE_MANUAL', 'BULK_MANUAL'],
    OFFLINE: ['SINGLE_MANUAL', 'BULK_EXCEL'],
  },
  COMBINED: {
    ONLINE: ['AUTOMATED', 'SINGLE_MANUAL'],
    OFFLINE: ['OMR_SCAN', 'BULK_EXCEL'],
  },
  MULTI: {
    ONLINE: ['AUTOMATED'],
    OFFLINE: ['OMR_SCAN', 'SINGLE_MANUAL'],
  },
};

/**
 * Convenience accessor that handles the empty productType case. Returns
 * `null` when no suggestion exists so callers can no-op.
 */
export function suggestedResultModes(
  productType: ExamProductType | '',
  deliveryMode: 'ONLINE' | 'OFFLINE',
): ResultInputMode[] | null {
  if (!productType) return null;
  return SUGGESTED_RESULT_MODES[productType]?.[deliveryMode] ?? null;
}

/** Shallow-equality check for two result-mode arrays (order-insensitive). */
export function resultInputModesEqual(a: ResultInputMode[], b: ResultInputMode[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/** Mirrors {@link preflightExam} / ResultInputModeSelector — one source of truth. */
export function isResultInputModeAllowed(
  mode: ResultInputMode,
  productType: ExamProductType | '',
  deliveryMode: 'ONLINE' | 'OFFLINE',
): boolean {
  if (mode === 'AUTOMATED' && deliveryMode !== 'ONLINE') return false;
  if (mode === 'OMR_SCAN') {
    if (deliveryMode !== 'OFFLINE') return false;
    if (productType === 'WRITTEN') return false;
  }
  return true;
}

/** Drop modes that conflict with the current type + delivery (e.g. AUTOMATED + Offline). */
export function sanitizeResultInputModes(
  productType: ExamProductType | '',
  deliveryMode: 'ONLINE' | 'OFFLINE',
  modes: ResultInputMode[],
): ResultInputMode[] {
  return modes.filter((m) => isResultInputModeAllowed(m, productType, deliveryMode));
}

export const RESULT_INPUT_MODE_LABELS: Record<ResultInputMode, string> = {
  AUTOMATED: 'Automatic (online grading)',
  SINGLE_MANUAL: 'Single manual entry',
  BULK_MANUAL: 'Bulk manual rows',
  BULK_EXCEL: 'Excel upload',
  OMR_SCAN: 'OMR scan',
};
