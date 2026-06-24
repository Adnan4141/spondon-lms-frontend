import { useEffect, useState } from 'react';
import type { ExamSubject } from '@/types/exam';
import { getExamById, getExamSections, getExamSubjects, type ExamSection } from '@/lib/api/exams';
import {
  defaultOmrConfig,
  migrateLegacyUiCategory,
  type ExamProductType,
  type ExamWizardState,
  type FolderRuleDraft,
  type SectionTypeUi,
  type SolveSheetVisibility,
  type WizardSection,
  type WizardSubject,
} from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { EXAM_WIZARD_ALL_BATCHES, EXAM_WIZARD_ALL_BRANCHES } from '../constants';
import type { ExamStatus, ResultInputMode } from '@/types/exam';
import type { Exam } from '@/types/exam';

const VALID_PRODUCT_TYPES = new Set<ExamProductType>(['MCQ', 'WRITTEN', 'COMBINED', 'MULTI']);
const VALID_RESULT_MODES = new Set<ResultInputMode>([
  'AUTOMATED',
  'SINGLE_MANUAL',
  'BULK_MANUAL',
  'BULK_EXCEL',
  'OMR_SCAN',
  'WRITTEN_EVAL',
]);
const VALID_SOLVE_VISIBILITIES = new Set<SolveSheetVisibility>(['IMMEDIATELY', 'HIDDEN', 'SCHEDULED']);

function readProductType(value: unknown): ExamProductType | '' {
  return typeof value === 'string' && VALID_PRODUCT_TYPES.has(value as ExamProductType)
    ? (value as ExamProductType)
    : '';
}

function readResultInputModes(value: unknown, fallback: ResultInputMode[]): ResultInputMode[] {
  if (!Array.isArray(value)) return fallback;
  const filtered = value.filter((m): m is ResultInputMode => typeof m === 'string' && VALID_RESULT_MODES.has(m as ResultInputMode));
  return filtered.length ? filtered : fallback;
}

function readSolveVisibility(value: unknown): SolveSheetVisibility | null {
  return typeof value === 'string' && VALID_SOLVE_VISIBILITIES.has(value as SolveSheetVisibility)
    ? (value as SolveSheetVisibility)
    : null;
}

function inferProductTypeFromSections(sections: Array<Pick<ExamSection, 'type'>>): ExamProductType {
  const hasMcq = sections.some((section) => section.type === 'MCQ');
  const hasCq = sections.some((section) => section.type === 'CQ' || section.type === 'SHORT');
  if (hasMcq && hasCq) return 'COMBINED';
  if (hasCq) return 'WRITTEN';
  return 'MCQ';
}

export function buildWizardPatchFromExam(exam: Exam): Partial<ExamWizardState> {
  const wizard = (exam.settings?.examWizard as Record<string, unknown> | undefined) ?? undefined;
  const workflow = (exam.settings?.examWorkflow as Record<string, unknown> | undefined) ?? undefined;

  const storedProductType = readProductType(wizard?.productType);
  const legacyMigration = storedProductType
    ? null
    : migrateLegacyUiCategory(
        (typeof wizard?.uiCategory === 'string' ? wizard.uiCategory : workflow?.method) as
          | Parameters<typeof migrateLegacyUiCategory>[0]
          | undefined,
        exam.mode,
      );

  const productType: ExamProductType | '' = storedProductType || legacyMigration?.productType || '';

  const savedDeliveryMode =
    workflow?.deliveryMode === 'OFFLINE' || workflow?.deliveryMode === 'ONLINE'
      ? (workflow.deliveryMode as 'ONLINE' | 'OFFLINE')
      : wizard?.deliveryMode === 'OFFLINE' || wizard?.deliveryMode === 'ONLINE'
        ? (wizard.deliveryMode as 'ONLINE' | 'OFFLINE')
        : legacyMigration?.deliveryMode
          ?? (exam.mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');
  const rawResultModes: ResultInputMode[] = Array.isArray(exam.resultInputModes) && exam.resultInputModes.length
    ? exam.resultInputModes
    : readResultInputModes(
        wizard?.resultInputModes ?? workflow?.resultInputModes,
        legacyMigration?.resultInputModes ?? ['AUTOMATED'],
      );

  const startAt = exam.startAt ? new Date(exam.startAt) : undefined;
  const endAt = exam.endAt ? new Date(exam.endAt) : undefined;
  const solveScheduledAt = exam.solveSheetScheduledAt ? new Date(exam.solveSheetScheduledAt) : undefined;

  const solveFromExam = readSolveVisibility(exam.solveSheetVisibility);
  const solveFromWizard = readSolveVisibility(wizard?.solveVisibility);
  const solveVisibility: SolveSheetVisibility =
    solveFromExam ?? solveFromWizard ?? (wizard?.showSolve === false ? 'HIDDEN' : 'IMMEDIATELY');

  // OMR config: prefer DB values (from previously saved exam), then default
  // if OMR_SCAN is in the result modes (will be re-validated by SET_COURSE).
  const dbOptionCount = Number(exam.omrOptionCount);
  const omrFromDb =
    exam.omrQuestionCount && exam.omrOptionCount
      ? {
          sheetSize: (typeof wizard?.omrSheetSize === 'string' ? wizard.omrSheetSize : '50') as ExamWizardState['omrConfig'] extends { sheetSize: infer S } | null ? Exclude<S, undefined> : never,
          questionCount: Number(exam.omrQuestionCount),
          optionCount: (dbOptionCount === 3 || dbOptionCount === 5 ? dbOptionCount : 4) as 3 | 4 | 5,
        }
      : null;
  const omrConfig = omrFromDb ?? (rawResultModes.includes('OMR_SCAN') && productType !== 'WRITTEN' ? defaultOmrConfig() : null);

  return {
    title: exam.title,
    courseId: exam.courseId,
    linkedCourseIds: (exam.examCourses ?? [])
      .map((row) => row.courseId)
      .filter((id) => id && id !== exam.courseId),
    branchId: exam.branchId ?? EXAM_WIZARD_ALL_BRANCHES,
    batchId: exam.batchId ?? EXAM_WIZARD_ALL_BATCHES,
    syllabusHtml: exam.syllabusHtml ?? '',
    proctorStrict: Boolean((exam.settings as { proctorStrict?: boolean } | null)?.proctorStrict),
    language: exam.language ?? 'bn',
    durationMinutes: String(exam.durationMinutes ?? 60),
    allowedAttempts: String(exam.allowedAttempts ?? 1),
    deliveryMode: savedDeliveryMode,
    autoSubmitOnDisconnect: Boolean(exam.autoSubmitOnDisconnect),
    disconnectGraceSeconds: String(exam.disconnectGraceSeconds ?? 10),
    showSolve:
      solveVisibility === 'IMMEDIATELY'
      || (typeof wizard?.showSolve === 'boolean' ? wizard.showSolve : true),
    showLeaderboard: exam.showLeaderboard ?? true,
    hideResult: exam.hideResult ?? false,
    showPct: exam.showPercentile ?? false,
    nSets: String(exam.totalSets ?? 4),
    shuffle: typeof wizard?.shuffle === 'string' ? wizard.shuffle : 'FULL',
    setNaming: (wizard?.setNaming as ExamWizardState['setNaming']) ?? 'ALPHA',
    productType,
    examType: exam.type ?? 'MODEL',
    scope: 'COURSE',
    universityName: exam.universityName ?? '',
    omrConfig,
    resultInputModes: rawResultModes,
    // Loaded exams count as the admin's intentional configuration — suppress
    // smart-preset auto-fills until they manually clear the field.
    resultInputModesUserEdited: true,
    smsNotification: Boolean(wizard?.smsNotification),
    startAt,
    endAt,
    solveVisibility,
    solveScheduledAt,
    defaultNegativeMarks:
      typeof wizard?.defaultNegativeMarks === 'number' ? (wizard.defaultNegativeMarks as number) : 0.25,
  };
}

interface Options {
  examId?: string;
  dispatch: React.Dispatch<WizardFormAction>;
  setActiveSectionId: (id: string | null) => void;
  setServerExam: (value: {
    status: ExamStatus;
    pdfUrl?: string | null;
    solveSheetUrl?: string | null;
    setCount?: number;
  } | null) => void;
  setStep1FieldErrors: (errors: Record<string, boolean>) => void;
  teacherUserId?: string;
}

/**
 * Loads an exam by id and merges the result into wizard state. Also exposes
 * loading status so the host can render a skeleton.
 */
export function useExamHydration({
  examId,
  dispatch,
  setActiveSectionId,
  setServerExam,
  setStep1FieldErrors,
  teacherUserId,
}: Options) {
  const [isLoadingExam, setIsLoadingExam] = useState(Boolean(examId));

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    (async () => {
      setIsLoadingExam(true);
      try {
        const [ex, secRes, subRes] = await Promise.all([
          getExamById(examId, teacherUserId ? { teacherUserId } : undefined),
          getExamSections(examId),
          getExamSubjects(examId),
        ]);
        if (cancelled || !ex.success || !ex.data) return;

        const basePatch = buildWizardPatchFromExam(ex.data);

        setServerExam({
          status: ex.data.status,
          pdfUrl: ex.data.pdfUrl ?? null,
          solveSheetUrl: ex.data.solveSheetUrl ?? null,
          setCount: ex.data.sets?.length ?? ex.data._count?.sets ?? 0,
        });

        if (subRes.success && subRes.data?.length) {
          const mappedSubjects: WizardSubject[] = subRes.data.map((s: ExamSubject) => ({
            localId: s.id,
            name: s.name,
            count: s.questionCount,
            mcqSingleCount: Number(s.mcqSingleCount ?? 0),
            mcqPassageCount: Number(s.mcqPassageCount ?? 0),
            cqCount: Number(s.cqCount ?? 0),
            shortCount: Number(s.shortCount ?? 0),
            marks: Number(s.marksPerQuestion ?? 1),
            neg: Number(s.negativeMarks ?? 0),
            passMarks: s.passMarks != null ? String(s.passMarks) : '',
            compulsory: s.isMandatory,
            folderRules: (s.folderRules ?? []).map((r) => ({
              folderId: r.folderId,
              folderName: r.folder?.name,
              questionCount: r.questionCount,
              selectionMode: r.selectionMode ?? 'RANDOM_COUNT',
              excludedQuestionIds: r.excludedQuestionIds ?? [],
              pinnedQuestionIds: r.pinnedQuestionIds ?? [],
            })),
          }));
          dispatch({
            type: 'MERGE',
            patch: {
              ...basePatch,
              subjects: mappedSubjects,
              sections: [],
              productType: 'MULTI',
            },
          });
          setActiveSectionId(mappedSubjects[0]?.localId ?? null);
          setStep1FieldErrors({});
          return;
        }

        if (secRes.success && secRes.data?.length) {
          const mapped: WizardSection[] = secRes.data.map((s: ExamSection) => ({
            localId: s.id,
            label: s.name,
            type: s.type as SectionTypeUi,
            count: s.questionCount || 0,
            ...(s.type === 'MCQ' ? { mcqPassageCount: s.mcqPassageCount ?? 0 } : {}),
            marks: Number(s.marksPerQuestion ?? 1),
            neg: Number(s.negativeMarks ?? 0),
            difficulty: 'MIXED',
            folderRules: Array.isArray(s.folderRules)
              ? (s.folderRules as FolderRuleDraft[]).map((r) => ({
                  folderId: r.folderId,
                  folderName: r.folderName,
                  questionCount: r.questionCount,
                  selectionMode: r.selectionMode ?? 'RANDOM_COUNT',
                  excludedQuestionIds: r.excludedQuestionIds ?? [],
                  pinnedQuestionIds: r.pinnedQuestionIds ?? [],
                }))
              : [],
          }));
          dispatch({
            type: 'MERGE',
            patch: {
              ...basePatch,
              sections: mapped,
              subjects: [],
              productType: basePatch.productType || inferProductTypeFromSections(secRes.data),
            },
          });
          setActiveSectionId(mapped[0]?.localId ?? null);
          setStep1FieldErrors({});
          return;
        }

        dispatch({ type: 'MERGE', patch: basePatch });
        setStep1FieldErrors({});
      } finally {
        if (!cancelled) setIsLoadingExam(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, examId, setActiveSectionId, setServerExam, setStep1FieldErrors, teacherUserId]);

  return { isLoadingExam };
}
