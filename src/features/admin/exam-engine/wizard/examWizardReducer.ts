import type {
  ExamProductType,
  ExamWizardState,
  FolderRuleDraft,
  SectionTypeUi,
  WizardSection,
  WizardSubject,
} from '../types';
import {
  resolveOmrConfigForState,
  resultInputModesEqual,
  sanitizeResultInputModes,
  suggestedResultModes,
} from '../types';
import { SEC_TYPES } from './constants';
import { defaultSectionsFor, newLocalId } from './wizardHelpers';

export type WizardFormAction =
  | { type: 'MERGE'; patch: Partial<ExamWizardState> }
  | { type: 'SET_STEP'; step: number }
  | { type: 'HYDRATE'; state: ExamWizardState }
  | { type: 'SET_COURSE'; courseId: string; /** Suggested default when no course was selected yet. */ defaultDeliveryMode?: 'ONLINE' | 'OFFLINE' }
  | { type: 'SET_DELIVERY_MODE'; deliveryMode: 'ONLINE' | 'OFFLINE' }
  | { type: 'APPLY_PRODUCT_TYPE'; productType: ExamProductType }
  | { type: 'SET_RESULT_INPUT_MODES'; modes: ExamWizardState['resultInputModes']; userEdited?: boolean }
  | { type: 'APPLY_SUGGESTED_RESULT_MODES' }
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
  | {
      type: 'ADD_SUBJECTS_FROM_FOLDER_ROOTS';
      roots: Array<{ folderId: string; name: string; defaultCount?: number }>;
    }
  | { type: 'UPDATE_SUBJECT'; localId: string; patch: Partial<WizardSubject> }
  | { type: 'REMOVE_SUBJECT'; localId: string };

function applyDeliveryModeChange(
  state: ExamWizardState,
  deliveryMode: 'ONLINE' | 'OFFLINE',
  patch: Partial<ExamWizardState> = {},
): ExamWizardState {
  const stripped = sanitizeResultInputModes(state.productType, deliveryMode, state.resultInputModes);
  const suggestion = suggestedResultModes(state.productType, deliveryMode);
  const nextModes = state.resultInputModesUserEdited
    ? (stripped.length > 0 ? stripped : (suggestion ?? stripped))
    : (suggestion ?? stripped);
  const offlineReset =
    deliveryMode === 'OFFLINE'
      ? { autoSubmitOnDisconnect: false as const, disconnectGraceSeconds: '10' }
      : {};
  const next = {
    ...state,
    ...patch,
    deliveryMode,
    resultInputModes: nextModes,
    ...offlineReset,
  };
  return { ...next, omrConfig: resolveOmrConfigForState(next, deliveryMode) };
}

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
    case 'SET_COURSE': {
      const isFirstSelection = !state.courseId;
      if (isFirstSelection && action.defaultDeliveryMode) {
        return applyDeliveryModeChange(state, action.defaultDeliveryMode, { courseId: action.courseId });
      }
      return { ...state, courseId: action.courseId };
    }
    case 'SET_DELIVERY_MODE':
      if (action.deliveryMode === state.deliveryMode) return state;
      return applyDeliveryModeChange(state, action.deliveryMode);
    case 'APPLY_PRODUCT_TYPE': {
      const sections = defaultSectionsFor(action.productType, state.defaultNegativeMarks);
      // Auto-fill result modes only when the admin hasn't manually touched the field.
      const suggestion = state.resultInputModesUserEdited
        ? state.resultInputModes
        : (suggestedResultModes(action.productType, state.deliveryMode) ?? state.resultInputModes);
      const next = {
        ...state,
        productType: action.productType,
        sections,
        subjects: action.productType === 'MULTI' ? state.subjects : [],
        resultInputModes: suggestion,
      };
      return { ...next, omrConfig: resolveOmrConfigForState(next, state.deliveryMode) };
    }
    case 'SET_RESULT_INPUT_MODES': {
      // Default: any explicit change counts as a user edit so we stop
      // overwriting the field on subsequent Type/Course changes.
      const userEdited = action.userEdited ?? true;
      const sanitized = sanitizeResultInputModes(
        state.productType,
        state.deliveryMode,
        action.modes,
      );
      const fallback =
        suggestedResultModes(state.productType, state.deliveryMode)
        ?? (['AUTOMATED'] as ExamWizardState['resultInputModes']);
      const nextModes = sanitized.length > 0 ? sanitized : fallback;
      const next = { ...state, resultInputModes: nextModes, resultInputModesUserEdited: userEdited };
      return { ...next, omrConfig: resolveOmrConfigForState(next, state.deliveryMode) };
    }
    case 'APPLY_SUGGESTED_RESULT_MODES': {
      const suggestion = suggestedResultModes(state.productType, state.deliveryMode);
      if (!suggestion || suggestion.length === 0) return state;
      if (resultInputModesEqual(state.resultInputModes, suggestion)) return state;
      // Applying the suggestion explicitly still counts as the user opting in
      // — but it's a controlled opt-in so we leave `userEdited` false. That
      // way switching Type/Course again still flows fresh suggestions.
      const next = { ...state, resultInputModes: suggestion, resultInputModesUserEdited: false };
      return { ...next, omrConfig: resolveOmrConfigForState(next, state.deliveryMode) };
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
    case 'ADD_SUBJECTS_FROM_FOLDER_ROOTS': {
      // Bulk-create one subject per top-level folder. Skip folders that are
      // already referenced (by folderId) in any existing subject so the action
      // is idempotent and safe to repeat.
      const existingFolderIds = new Set(
        state.subjects.flatMap((s) => s.folderRules.map((r) => r.folderId)),
      );
      const newSubjects: WizardSubject[] = action.roots
        .filter((r) => r.folderId && !existingFolderIds.has(r.folderId))
        .map((r) => {
          const count = Math.max(1, r.defaultCount ?? 20);
          return {
            localId: newLocalId(),
            name: r.name || 'Subject',
            count,
            mcqSingleCount: count,
            mcqPassageCount: 0,
            cqCount: 0,
            shortCount: 0,
            marks: 1,
            neg: state.defaultNegativeMarks ?? 0.25,
            passMarks: '',
            compulsory: true,
            folderRules: [
              {
                folderId: r.folderId,
                folderName: r.name,
                questionCount: count,
                selectionMode: 'RANDOM_COUNT',
                excludedQuestionIds: [],
                pinnedQuestionIds: [],
              },
            ],
          };
        });
      return { ...state, subjects: [...state.subjects, ...newSubjects] };
    }
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
