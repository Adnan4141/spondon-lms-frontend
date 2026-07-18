import type {
  ExamEngineType,
  ExamMode,
  ExamScope,
  ExamType,
  ResultInputMode,
  SelectionMode,
} from '@/types/exam';
import type { Course } from '@/types/course';

/**
 * Spec exam types (4). Replaces the previous 7-way `UiExamCategory` which
 * conflated type, mode, and result-entry method.
 *
 * Orthogonal axes are now: { productType, deliveryMode, courseId, omrConfig?, resultInputModes[], smsNotification }.
 * Delivery mode is independent of course type — admins may run online exams on offline courses
 * (and vice versa). Persisted into settings.examWorkflow so runtime routing never has to guess.
 */
export type ExamProductType = 'MCQ' | 'WRITTEN' | 'COMBINED' | 'MULTI';

/**
 * @deprecated Retained only for legacy migration in {@link migrateLegacyUiCategory}.
 * New code must use {@link ExamProductType} + the orthogonal axes on `ExamWizardState`.
 */
export type UiExamCategory = 'MCQ' | 'CQ' | 'MCQCQ' | 'MULTI' | 'OMR' | 'OMRB' | 'OFFLINE_RESULT';

export type SectionTypeUi = 'MCQ' | 'CQ' | 'SHORT';

/** Predefined OMR sheet sizes per Mathlab public dynamic spec. */
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

  /** Exam product type axis (MCQ, WRITTEN, COMBINED, MULTI). */
  productType: ExamProductType | '';
  /** Published exam category (practice, scheduled, talent hunt, etc.). */
  examType: ExamType;
  /** Always course enrollment — students in selected course(s), optionally filtered by branch/batch. */
  scope: ExamScope;
  /** Shown for UNIVERSITY exams. */
  universityName: string;
  /** How students take the exam — independent of the linked course's type. */
  deliveryMode: 'ONLINE' | 'OFFLINE';
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
  /** Primary course — DB `courseId`, branch/batch scope, and SMS audience. */
  courseId: string;
  /** Additional audience courses (stored in `ExamCourse`; excludes `courseId`). */
  linkedCourseIds: string[];
  /** Per-course branch/batch scope — primary course mirrors top-level `branchId`/`batchId`. */
  courseAudienceScopes: Record<string, { branchId: string; batchId: string }>;
  branchId: string;
  /** Optional batch scope — all batches when sentinel value. */
  batchId: string;
  /** Pre-exam instructions shown to students (HTML). */
  syllabusHtml: string;
  /** Strict tab-switch limit during online attempts (stored in exam.settings). */
  proctorStrict: boolean;
  language: string;
  durationMinutes: string;
  /** Max completed attempts per student (online exams). */
  allowedAttempts: string;
  autoSubmitOnDisconnect: boolean;
  disconnectGraceSeconds: string;
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
}

/**
 * Suggested default delivery mode when a course is first selected.
 * Does not override an admin's explicit delivery-mode choice.
 */
export function defaultDeliveryModeForCourse(
  courseId: string,
  courses: Pick<Course, 'id' | 'type'>[],
): 'ONLINE' | 'OFFLINE' {
  const courseType = courses.find((c) => c.id === courseId)?.type;
  return courseType === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
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

/** Resolve persisted engine from product type + exam category. */
export function resolveExamEngine(
  productType: ExamProductType,
  examType: ExamType,
  isOmrBook: boolean,
): ExamEngineType | undefined {
  if (isOmrBook) return 'OMR_BOOK';
  if (examType === 'TALENT_HUNT') return 'TALENT_HUNT';
  if (examType === 'UNIVERSITY') return 'UNIVERSITY_SPECIAL';
  return mapProductTypeToEngine(productType, false);
}

export const EXAM_TYPE_OPTIONS: { id: ExamType; label: string; description: string }[] = [
  { id: 'MODEL', label: 'Model test', description: 'Standard mock / model exam.' },
  { id: 'PRACTICE', label: 'Practice', description: 'Low-stakes practice for students.' },
  { id: 'SCHEDULED', label: 'Scheduled', description: 'Fixed-window formal assessment.' },
  { id: 'TALENT_HUNT', label: 'Talent hunt', description: 'Multi-stage elimination — configure stages after publish.' },
  { id: 'UNIVERSITY', label: 'University admission', description: 'University-style paper with optional institution name.' },
];

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
 * Uses `state.deliveryMode` to decide whether OMR defaults apply.
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
  if (mode === 'WRITTEN_EVAL') {
    if (deliveryMode !== 'ONLINE') return false;
    if (productType !== 'WRITTEN' && productType !== 'COMBINED') return false;
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
  WRITTEN_EVAL: 'Written evaluation',
};
