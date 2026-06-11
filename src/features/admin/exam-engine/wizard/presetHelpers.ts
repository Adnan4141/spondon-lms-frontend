/**
 * Blueprint presets capture reusable exam structure (sections, subjects, OMR config).
 * The exam wizard is the primary authoring path — presets are optional shortcuts applied in step 1.
 */
import type { ExamBlueprint } from '@/lib/api/exams';
import type {
  ExamProductType,
  ExamWizardState,
  OmrConfig,
  SolveSheetVisibility,
  UiExamCategory,
  WizardSection,
  WizardSubject,
} from '../types';
import { migrateLegacyUiCategory } from '../types';
import { newLocalId } from './wizardHelpers';
import type { ResultInputMode } from '@/types/exam';

type WizardPresetConfigV1 = {
  version: 1;
  /** @deprecated v1 schema — migrated to v2 on load. */
  uiCategory: UiExamCategory | '';
  deliveryMode?: string;
  /** @deprecated courseIds no longer stored in presets. */
  courseIds?: string[];
  language: string;
  durationMinutes: string;
  autoSubmitOnDisconnect: boolean;
  disconnectGraceSeconds: string;
  sections: WizardSection[];
  subjects: WizardSubject[];
  nSets: string;
  shuffle: string;
  setNaming: ExamWizardState['setNaming'];
  showLeaderboard: boolean;
  hideResult: boolean;
  showSolve: boolean;
  showPct: boolean;
  resultModes: string[];
};

type WizardPresetConfigV2 = {
  version: 2;
  productType: ExamProductType | '';
  deliveryMode?: 'ONLINE' | 'OFFLINE';
  omrConfig: OmrConfig | null;
  resultInputModes: ResultInputMode[];
  smsNotification: boolean;
  solveVisibility: SolveSheetVisibility;
  defaultNegativeMarks: number;
  language: string;
  durationMinutes: string;
  autoSubmitOnDisconnect: boolean;
  disconnectGraceSeconds: string;
  sections: WizardSection[];
  subjects: WizardSubject[];
  nSets: string;
  shuffle: string;
  setNaming: ExamWizardState['setNaming'];
  showLeaderboard: boolean;
  hideResult: boolean;
  showSolve: boolean;
  showPct: boolean;
};

export type WizardPresetStructure = ExamBlueprint & {
  wizard?: WizardPresetConfigV1 | WizardPresetConfigV2;
};

function sectionDifficulty() {
  return { easy: 34, medium: 33, hard: 33 };
}

function buildBlueprintSections(state: ExamWizardState): ExamBlueprint['sections'] {
  if (state.productType === 'MULTI') return [];

  return state.sections.map((section) => ({
    name: section.label,
    type: section.type,
    questionCount: section.count,
    marksPerQuestion: section.marks,
    negativeMarks: section.neg,
    isMandatory: true,
    difficultyDistribution: sectionDifficulty(),
    folderRules: section.folderRules.map((rule) => ({
      folderId: rule.folderId,
      folderName: rule.folderName,
      questionCount: rule.questionCount,
      selectionMode: rule.selectionMode === 'MANUAL_PICK' ? 'MANUAL' : 'RANDOM',
      includeDescendants: true,
      pinnedQuestionIds: rule.pinnedQuestionIds,
      excludedQuestionIds: rule.excludedQuestionIds,
    })),
  }));
}

export function buildPresetStructure(state: ExamWizardState): WizardPresetStructure {
  const v2: WizardPresetConfigV2 = {
    version: 2,
    productType: state.productType,
    deliveryMode: state.deliveryMode,
    omrConfig: state.omrConfig,
    resultInputModes: state.resultInputModes,
    smsNotification: state.smsNotification,
    solveVisibility: state.solveVisibility,
    defaultNegativeMarks: state.defaultNegativeMarks,
    // courseId intentionally omitted — presets are course-agnostic
    language: state.language,
    durationMinutes: state.durationMinutes,
    autoSubmitOnDisconnect: state.autoSubmitOnDisconnect,
    disconnectGraceSeconds: state.disconnectGraceSeconds,
    sections: state.sections,
    subjects: state.subjects,
    nSets: state.nSets,
    shuffle: state.shuffle,
    setNaming: state.setNaming,
    showLeaderboard: state.showLeaderboard,
    hideResult: state.hideResult,
    showSolve: state.showSolve,
    showPct: state.showPct,
  };

  return {
    sections: buildBlueprintSections(state),
    settings: {
      totalSets: Math.max(1, Number(state.nSets) || 1),
      durationMinutes: Math.max(10, Number(state.durationMinutes) || 60),
      shuffleQuestions: state.shuffle !== 'ORDER',
      shuffleOptions: state.shuffle === 'FULL' || state.shuffle === 'OPTS' || state.shuffle === 'MIXED',
      uniqueSets: true,
      language: state.language === 'en' ? 'en' : 'bn',
      negativeMarking:
        state.defaultNegativeMarks > 0
        || state.sections.some((section) => section.neg > 0)
        || state.subjects.some((subject) => subject.neg > 0),
    },
    wizard: v2,
  };
}

export function presetPatchFromStructure(structure: WizardPresetStructure): Partial<ExamWizardState> | null {
  const wizard = structure.wizard;
  if (wizard?.version === 2) {
    return {
      productType: wizard.productType,
      deliveryMode:
        wizard.deliveryMode === 'OFFLINE' || wizard.deliveryMode === 'ONLINE'
          ? wizard.deliveryMode
          : undefined,
      omrConfig: wizard.omrConfig ?? null,
      resultInputModes: Array.isArray(wizard.resultInputModes) && wizard.resultInputModes.length
        ? wizard.resultInputModes
        : ['AUTOMATED'],
      smsNotification: Boolean(wizard.smsNotification),
      solveVisibility: wizard.solveVisibility ?? 'IMMEDIATELY',
      defaultNegativeMarks: typeof wizard.defaultNegativeMarks === 'number' ? wizard.defaultNegativeMarks : 0.25,
      // courseId intentionally excluded — presets are course-agnostic
      language: wizard.language,
      durationMinutes: wizard.durationMinutes,
      autoSubmitOnDisconnect: wizard.autoSubmitOnDisconnect,
      disconnectGraceSeconds: wizard.disconnectGraceSeconds,
      sections: wizard.sections.map((section) => ({ ...section, localId: newLocalId() })),
      subjects: wizard.subjects.map((subject) => ({ ...subject, localId: newLocalId() })),
      nSets: wizard.nSets,
      shuffle: wizard.shuffle,
      setNaming: wizard.setNaming,
      showLeaderboard: wizard.showLeaderboard,
      hideResult: wizard.hideResult,
      showSolve: wizard.showSolve,
      showPct: wizard.showPct,
    };
  }

  if (wizard?.version === 1) {
    const migrated = migrateLegacyUiCategory(wizard.uiCategory, undefined);
    const legacyResultModes = Array.isArray(wizard.resultModes) && wizard.resultModes.length
      ? wizard.resultModes as ExamWizardState['resultInputModes']
      : migrated.resultInputModes;
    return {
      productType: migrated.productType,
      deliveryMode: migrated.deliveryMode,
      omrConfig: null,
      resultInputModes: legacyResultModes,
      smsNotification: false,
      solveVisibility: wizard.showSolve ? 'IMMEDIATELY' : 'HIDDEN',
      defaultNegativeMarks: 0.25,
      // courseId intentionally excluded — presets are course-agnostic
      language: wizard.language,
      durationMinutes: wizard.durationMinutes,
      autoSubmitOnDisconnect: wizard.autoSubmitOnDisconnect,
      disconnectGraceSeconds: wizard.disconnectGraceSeconds,
      sections: wizard.sections.map((section) => ({ ...section, localId: newLocalId() })),
      subjects: wizard.subjects.map((subject) => ({ ...subject, localId: newLocalId() })),
      nSets: wizard.nSets,
      shuffle: wizard.shuffle,
      setNaming: wizard.setNaming,
      showLeaderboard: wizard.showLeaderboard,
      hideResult: wizard.hideResult,
      showSolve: wizard.showSolve,
      showPct: wizard.showPct,
    };
  }

  if (!structure.sections?.length) return null;

  const inferredType: ExamProductType = structure.sections.some((section) => section.type === 'CQ')
    ? structure.sections.some((section) => section.type === 'MCQ')
      ? 'COMBINED'
      : 'WRITTEN'
    : 'MCQ';

  return {
    productType: inferredType,
    durationMinutes: String(structure.settings.durationMinutes ?? 60),
    language: structure.settings.language ?? 'bn',
    nSets: String(structure.settings.totalSets ?? 1),
    sections: structure.sections.map((section) => ({
      localId: newLocalId(),
      label: section.name,
      type: section.type,
      count: section.questionCount,
      marks: section.marksPerQuestion,
      neg: section.negativeMarks ?? 0,
      difficulty: 'MIXED',
      folderRules: section.folderRules.map((rule) => ({
        folderId: rule.folderId,
        folderName: rule.folderName,
        questionCount: rule.questionCount,
        selectionMode: rule.selectionMode === 'MANUAL' ? 'MANUAL_PICK' : 'RANDOM_COUNT',
        excludedQuestionIds: rule.excludedQuestionIds ?? [],
        pinnedQuestionIds: rule.pinnedQuestionIds ?? [],
      })),
    })),
    subjects: [],
  };
}

export function presetQuestionTotal(state: ExamWizardState): number {
  if (state.productType === 'MULTI') {
    return state.subjects.reduce((sum, subject) => sum + subject.count, 0);
  }
  return state.sections.reduce((sum, section) => sum + section.count, 0);
}
