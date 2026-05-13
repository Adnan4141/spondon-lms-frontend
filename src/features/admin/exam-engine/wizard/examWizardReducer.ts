import type {
  ExamWizardState,
  FolderRuleDraft,
  SectionTypeUi,
  UiExamCategory,
  WizardSection,
  WizardSubject,
} from '../types';
import { SEC_TYPES } from './constants';
import { defaultSectionsFor, newLocalId } from './wizardHelpers';

export type WizardFormAction =
  | { type: 'MERGE'; patch: Partial<ExamWizardState> }
  | { type: 'SET_STEP'; step: number }
  | { type: 'HYDRATE'; state: ExamWizardState }
  | { type: 'APPLY_CATEGORY'; category: UiExamCategory }
  | { type: 'ADD_SECTION'; section: WizardSection }
  | { type: 'REMOVE_SECTION'; localId: string }
  | { type: 'UPDATE_SECTION'; localId: string; patch: Partial<WizardSection> }
  | { type: 'TOGGLE_FOLDER'; sectionLocalId: string; folderId: string; folderName: string; defaultCount?: number }
  | { type: 'UPDATE_RULE_COUNT'; sectionLocalId: string; folderId: string; count: number }
  | { type: 'UPDATE_RULE_MODE'; sectionLocalId: string; folderId: string; selectionMode: FolderRuleDraft['selectionMode'] }
  | { type: 'REMOVE_FOLDER_RULE'; sectionLocalId: string; folderId: string }
  | { type: 'TOGGLE_SUBJECT_FOLDER'; subjectLocalId: string; folderId: string; folderName: string; defaultCount?: number }
  | { type: 'UPDATE_SUBJECT_RULE_COUNT'; subjectLocalId: string; folderId: string; count: number }
  | { type: 'UPDATE_SUBJECT_RULE_MODE'; subjectLocalId: string; folderId: string; selectionMode: FolderRuleDraft['selectionMode'] }
  | { type: 'REMOVE_SUBJECT_FOLDER_RULE'; subjectLocalId: string; folderId: string }
  | {
      type: 'APPLY_PICKER';
      sectionLocalId?: string;
      subjectLocalId?: string;
      folderId: string;
      excludedQuestionIds: string[];
      pinnedQuestionIds: string[];
      selectionMode: FolderRuleDraft['selectionMode'];
    }
  | { type: 'ADD_SUBJECT' }
  | { type: 'UPDATE_SUBJECT'; localId: string; patch: Partial<WizardSubject> }
  | { type: 'REMOVE_SUBJECT'; localId: string };

export function examWizardReducer(state: ExamWizardState, action: WizardFormAction): ExamWizardState {
  switch (action.type) {
    case 'MERGE':
      return { ...state, ...action.patch };
    case 'SET_STEP': {
      const step = Math.min(6, Math.max(1, action.step));
      return { ...state, step };
    }
    case 'HYDRATE':
      return { ...action.state };
    case 'APPLY_CATEGORY': {
      const sections = defaultSectionsFor(action.category);
      const deliveryMode = action.category === 'OFFLINE_RESULT' || action.category === 'OMR' || action.category === 'OMRB'
        ? 'OFFLINE'
        : 'ONLINE';
      return {
        ...state,
        uiCategory: action.category,
        deliveryMode,
        sections,
        subjects: action.category === 'MULTI' ? state.subjects : [],
      };
    }
    case 'ADD_SECTION':
      return { ...state, sections: [...state.sections, action.section] };
    case 'REMOVE_SECTION':
      return { ...state, sections: state.sections.filter((s) => s.localId !== action.localId) };
    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.localId === action.localId ? { ...s, ...action.patch } : s,
        ),
      };
    case 'TOGGLE_FOLDER': {
      const { sectionLocalId, folderId, folderName } = action;
      return {
        ...state,
        sections: state.sections.map((sec) => {
          if (sec.localId !== sectionLocalId) return sec;
          const has = sec.folderRules.some((r) => r.folderId === folderId);
          if (has) {
            return { ...sec, folderRules: sec.folderRules.filter((r) => r.folderId !== folderId) };
          }
          const def = Math.max(1, action.defaultCount ?? Math.ceil(sec.count / Math.max(1, sec.folderRules.length + 1)));
          return {
            ...sec,
            folderRules: [
              ...sec.folderRules,
              {
                folderId,
                folderName,
                questionCount: def,
                selectionMode: 'RANDOM_COUNT' as const,
                excludedQuestionIds: [],
                pinnedQuestionIds: [],
              },
            ],
          };
        }),
      };
    }
    case 'UPDATE_RULE_COUNT':
      return {
        ...state,
        sections: state.sections.map((sec) => {
          if (sec.localId !== action.sectionLocalId) return sec;
          return {
            ...sec,
            folderRules: sec.folderRules.map((r) =>
              r.folderId === action.folderId ? { ...r, questionCount: Math.max(1, action.count) } : r,
            ),
          };
        }),
      };
    case 'UPDATE_RULE_MODE':
      return {
        ...state,
        sections: state.sections.map((sec) => {
          if (sec.localId !== action.sectionLocalId) return sec;
          return {
            ...sec,
            folderRules: sec.folderRules.map((r) =>
              r.folderId === action.folderId ? { ...r, selectionMode: action.selectionMode } : r,
            ),
          };
        }),
      };
    case 'REMOVE_FOLDER_RULE':
      return {
        ...state,
        sections: state.sections.map((sec) => {
          if (sec.localId !== action.sectionLocalId) return sec;
          return { ...sec, folderRules: sec.folderRules.filter((r) => r.folderId !== action.folderId) };
        }),
      };
    case 'APPLY_PICKER':
      return {
        ...state,
        sections: state.sections.map((sec) => {
          if (!action.sectionLocalId || sec.localId !== action.sectionLocalId) return sec;
          return {
            ...sec,
            folderRules: sec.folderRules.map((r) =>
              r.folderId === action.folderId
                ? {
                    ...r,
                    excludedQuestionIds: action.excludedQuestionIds,
                    pinnedQuestionIds: action.pinnedQuestionIds,
                    selectionMode: action.selectionMode,
                  }
                : r,
            ),
          };
        }),
        subjects: state.subjects.map((sub) => {
          if (!action.subjectLocalId || sub.localId !== action.subjectLocalId) return sub;
          return {
            ...sub,
            folderRules: sub.folderRules.map((r) =>
              r.folderId === action.folderId
                ? {
                    ...r,
                    excludedQuestionIds: action.excludedQuestionIds,
                    pinnedQuestionIds: action.pinnedQuestionIds,
                    selectionMode: action.selectionMode,
                  }
                : r,
            ),
          };
        }),
      };
    case 'ADD_SUBJECT':
      return {
        ...state,
        subjects: [
          ...state.subjects,
          {
            localId: newLocalId(),
            name: '',
            count: 25,
            mcqSingleCount: 25,
            mcqPassageCount: 0,
            cqCount: 0,
            shortCount: 0,
            marks: 1,
            neg: 0.25,
            passMarks: '',
            compulsory: true,
            folderRules: [],
          },
        ],
      };
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map((x) =>
          x.localId === action.localId ? { ...x, ...action.patch } : x,
        ),
      };
    case 'REMOVE_SUBJECT':
      return { ...state, subjects: state.subjects.filter((x) => x.localId !== action.localId) };
    case 'TOGGLE_SUBJECT_FOLDER': {
      const { subjectLocalId, folderId, folderName } = action;
      return {
        ...state,
        subjects: state.subjects.map((sub) => {
          if (sub.localId !== subjectLocalId) return sub;
          const has = sub.folderRules.some((r) => r.folderId === folderId);
          if (has) return { ...sub, folderRules: sub.folderRules.filter((r) => r.folderId !== folderId) };
          const def = Math.max(1, action.defaultCount ?? Math.ceil(sub.count / Math.max(1, sub.folderRules.length + 1)));
          return {
            ...sub,
            folderRules: [
              ...sub.folderRules,
              {
                folderId,
                folderName,
                questionCount: def,
                selectionMode: 'RANDOM_COUNT' as const,
                excludedQuestionIds: [],
                pinnedQuestionIds: [],
              },
            ],
          };
        }),
      };
    }
    case 'UPDATE_SUBJECT_RULE_COUNT':
      return {
        ...state,
        subjects: state.subjects.map((sub) =>
          sub.localId === action.subjectLocalId
            ? {
                ...sub,
                folderRules: sub.folderRules.map((r) =>
                  r.folderId === action.folderId ? { ...r, questionCount: Math.max(1, action.count) } : r,
                ),
              }
            : sub,
        ),
      };
    case 'UPDATE_SUBJECT_RULE_MODE':
      return {
        ...state,
        subjects: state.subjects.map((sub) =>
          sub.localId === action.subjectLocalId
            ? {
                ...sub,
                folderRules: sub.folderRules.map((r) =>
                  r.folderId === action.folderId ? { ...r, selectionMode: action.selectionMode } : r,
                ),
              }
            : sub,
        ),
      };
    case 'REMOVE_SUBJECT_FOLDER_RULE':
      return {
        ...state,
        subjects: state.subjects.map((sub) =>
          sub.localId === action.subjectLocalId
            ? { ...sub, folderRules: sub.folderRules.filter((r) => r.folderId !== action.folderId) }
            : sub,
        ),
      };
    default:
      return state;
  }
}

export function buildSectionFromType(tid: SectionTypeUi): WizardSection {
  const t = SEC_TYPES.find((x) => x.id === tid)!;
  return {
    localId: newLocalId(),
    type: tid,
    label: t.label,
    count: tid === 'MCQ' ? 30 : tid === 'CQ' ? 8 : 10,
    ...(tid === 'MCQ' ? { mcqPassageCount: 0 as const } : {}),
    marks: t.dm,
    neg: t.dn,
    difficulty: 'MIXED',
    folderRules: [],
  };
}
