import type { ExamBlueprint } from '@/lib/api/exams';
import type { ExamWizardState, UiExamCategory, WizardSection, WizardSubject } from '../types';
import { newLocalId } from './wizardHelpers';

type WizardPresetConfig = {
  version: 1;
  uiCategory: UiExamCategory | '';
  deliveryMode: ExamWizardState['deliveryMode'];
  courseIds: string[];
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

export type WizardPresetStructure = ExamBlueprint & {
  wizard?: WizardPresetConfig;
};

function sectionDifficulty() {
  return { easy: 34, medium: 33, hard: 33 };
}

function buildBlueprintSections(state: ExamWizardState): ExamBlueprint['sections'] {
  if (state.uiCategory === 'MULTI') return [];

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
  return {
    sections: buildBlueprintSections(state),
    settings: {
      totalSets: Math.max(1, Number(state.nSets) || 1),
      durationMinutes: Math.max(10, Number(state.durationMinutes) || 60),
      shuffleQuestions: state.shuffle !== 'ORDER',
      shuffleOptions: state.shuffle === 'FULL' || state.shuffle === 'OPTS' || state.shuffle === 'MIXED',
      uniqueSets: true,
      language: state.language === 'en' ? 'en' : 'bn',
      negativeMarking: state.sections.some((section) => section.neg > 0) || state.subjects.some((subject) => subject.neg > 0),
    },
    wizard: {
      version: 1,
      uiCategory: state.uiCategory,
      deliveryMode: state.deliveryMode,
      courseIds: [...state.courseIds],
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
      resultModes: state.resultModes,
    },
  };
}

export function presetPatchFromStructure(structure: WizardPresetStructure): Partial<ExamWizardState> | null {
  if (structure.wizard?.version === 1) {
    return {
      uiCategory: structure.wizard.uiCategory,
      deliveryMode: structure.wizard.deliveryMode,
      courseIds: Array.isArray(structure.wizard.courseIds) ? [...structure.wizard.courseIds] : [],
      language: structure.wizard.language,
      durationMinutes: structure.wizard.durationMinutes,
      autoSubmitOnDisconnect: structure.wizard.autoSubmitOnDisconnect,
      disconnectGraceSeconds: structure.wizard.disconnectGraceSeconds,
      sections: structure.wizard.sections.map((section) => ({ ...section, localId: newLocalId() })),
      subjects: structure.wizard.subjects.map((subject) => ({ ...subject, localId: newLocalId() })),
      nSets: structure.wizard.nSets,
      shuffle: structure.wizard.shuffle,
      setNaming: structure.wizard.setNaming,
      showLeaderboard: structure.wizard.showLeaderboard,
      hideResult: structure.wizard.hideResult,
      showSolve: structure.wizard.showSolve,
      showPct: structure.wizard.showPct,
      resultModes: structure.wizard.resultModes,
    };
  }

  if (!structure.sections?.length) return null;

  return {
    uiCategory: structure.sections.some((section) => section.type === 'CQ')
      ? structure.sections.some((section) => section.type === 'MCQ')
        ? 'MCQCQ'
        : 'CQ'
      : 'MCQ',
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
  if (state.uiCategory === 'MULTI') {
    return state.subjects.reduce((sum, subject) => sum + subject.count, 0);
  }
  return state.sections.reduce((sum, section) => sum + section.count, 0);
}
