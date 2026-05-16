'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useModalStore } from '@/store/modalStore';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import {
  createExam,
  updateExam,
  createExamSection,
  createExamSubject,
  deleteExam,
  deleteExamSection,
  deleteExamSubject,
  generateFromSubjects,
  generateSectionSets,
  getExamSections,
  getExamSubjects,
  getExamById,
  getExamCourseLinks,
  listBlueprintPresets,
  getBlueprintPreset,
  createBlueprintPreset,
  updateBlueprintPreset,
  linkExamCourse,
  unlinkExamCourse,
  validateExamSubjects,
  validateSectionGeneration,
  type ExamSection,
} from '@/lib/api/exams';
import type { Course } from '@/types/course';
import type { ExamSubject } from '@/types/exam';
import type { Branch } from '@/lib/api/branches';
import type { CreateExamDto, Exam, ExamStatus, UpdateExamDto } from '@/types/exam';
import type { ExamBlueprintPreset } from '@/lib/api/exams';
import { QuestionPickerModal } from './components/QuestionPickerModal';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';
import {
  type ExamWizardState,
  type FolderRuleDraft,
  type UiExamCategory,
  type WizardSection,
  type WizardSubject,
  type SectionTypeUi,
  WIZARD_STEPS,
  mapDeliveryToExamMode,
  mapUiCategoryToExamType,
} from './types';
import { examWizardReducer, buildSectionFromType } from './wizard/examWizardReducer';
import {
  WIZARD_FORM_INITIAL,
  deserializeWizardForm,
  draftStorageKey,
  flattenFolders,
  parseStepParam,
  primaryCourseId,
  serializeWizardForm,
} from './wizard/wizardHelpers';
import {
  buildPresetStructure,
  presetPatchFromStructure,
  type WizardPresetStructure,
} from './wizard/presetHelpers';
import { EXAM_WIZARD_ALL_BRANCHES } from './wizard/constants';
import { useExamWizardFolderTree } from './wizard/useExamWizardFolderTree';
import { validateStep, type Step1FieldKey } from './wizard/validateWizardStep';
import { Step1CategoryInfo } from './wizard/steps/Step1CategoryInfo';
import { Step2Sections } from './wizard/steps/Step2Sections';
import { Step3QuestionBank } from './wizard/steps/Step3QuestionBank';
import { Step4SetsPdf } from './wizard/steps/Step4SetsPdf';
import { Step5ResultVisibility } from './wizard/steps/Step5ResultVisibility';
import { Step6PreviewPublish } from './wizard/steps/Step6PreviewPublish';

function readUiCategory(value: unknown): UiExamCategory | '' {
  if (
    value === 'MCQ' ||
    value === 'CQ' ||
    value === 'MCQCQ' ||
    value === 'MULTI' ||
    value === 'OMR' ||
    value === 'OMRB' ||
    value === 'OFFLINE_RESULT'
  ) {
    return value;
  }
  return '';
}

function inferUiCategoryFromSections(sections: Array<Pick<ExamSection, 'type'>>): UiExamCategory {
  const hasMcq = sections.some((section) => section.type === 'MCQ');
  const hasCq = sections.some((section) => section.type === 'CQ');
  if (hasMcq && hasCq) return 'MCQCQ';
  if (hasCq) return 'CQ';
  return 'MCQ';
}

function buildWizardPatchFromExam(exam: Exam): Partial<ExamWizardState> {
  const wizard = (exam.settings?.examWizard as Record<string, unknown> | undefined) ?? undefined;
  return {
    title: exam.title,
    branchId: exam.branchId ?? EXAM_WIZARD_ALL_BRANCHES,
    language: exam.language ?? 'bn',
    durationMinutes: String(exam.durationMinutes ?? 60),
    deliveryMode: exam.mode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
    autoSubmitOnDisconnect: Boolean(exam.autoSubmitOnDisconnect),
    disconnectGraceSeconds: String(exam.disconnectGraceSeconds ?? 10),
    showSolve:
      exam.solveSheetVisibility === 'IMMEDIATELY'
      || (typeof wizard?.showSolve === 'boolean' ? wizard.showSolve : true),
    showLeaderboard: exam.showLeaderboard ?? true,
    hideResult: exam.hideResult ?? false,
    showPct: exam.showPercentile ?? false,
    nSets: String(exam.totalSets ?? 4),
    shuffle: typeof wizard?.shuffle === 'string' ? wizard.shuffle : 'FULL',
    setNaming: (wizard?.setNaming as ExamWizardState['setNaming']) ?? 'ALPHA',
    resultModes: Array.isArray(wizard?.resultModes)
      ? (wizard.resultModes as string[])
      : Array.isArray((exam.settings?.examWorkflow as Record<string, unknown> | undefined)?.resultInputModes)
        ? ((exam.settings?.examWorkflow as Record<string, unknown>).resultInputModes as string[])
        : ['AUTO'],
    uiCategory: readUiCategory(wizard?.uiCategory || (exam.settings?.examWorkflow as Record<string, unknown> | undefined)?.method),
  };
}

type PickerTarget = { sectionLocalId: string; rule: FolderRuleDraft } | null;

export function ExamWizard({ examId, initialTitle }: { examId?: string; initialTitle?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const step = parseStepParam(searchParams.get('step'));

  const [state, dispatch] = useReducer(examWizardReducer, WIZARD_FORM_INITIAL);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saveAction, setSaveAction] = useState<null | 'draft' | 'finalize'>(null);
  const saveInFlightRef = useRef(false);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [step1FieldErrors, setStep1FieldErrors] = useState<Partial<Record<Step1FieldKey, boolean>>>({});
  const [serverExam, setServerExam] = useState<{ status: ExamStatus; pdfUrl?: string | null } | null>(null);
  const [presets, setPresets] = useState<ExamBlueprintPreset[]>([]);
  const [presetBusy, setPresetBusy] = useState(false);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(Boolean(examId));

  const draftHydratedRef = useRef(false);
  const urlInitializedRef = useRef(false);

  const selectedPrimaryCourseId = primaryCourseId(state.courseIds);
  const { tree, loading: folderLoading, fallbackAll: folderFallbackAll } = useExamWizardFolderTree(selectedPrimaryCourseId, step, 3);
  const leaves = useMemo(() => flattenFolders(tree), [tree]);

  const toast = useAdminToast();
  const { openModal } = useModalStore();

  useEffect(() => {
    dispatch({ type: 'SET_STEP', step });
  }, [step]);

  useEffect(() => {
    if (state.uiCategory === 'MULTI') {
      if (!state.subjects.length) {
        if (activeSectionId) setActiveSectionId(null);
        return;
      }
      if (!activeSectionId || !state.subjects.some((s) => s.localId === activeSectionId)) {
        setActiveSectionId(state.subjects[0].localId);
      }
      return;
    }
    if (!state.sections.length) {
      if (activeSectionId) setActiveSectionId(null);
      return;
    }
    if (!activeSectionId || !state.sections.some((s) => s.localId === activeSectionId)) {
      setActiveSectionId(state.sections[0].localId);
    }
  }, [activeSectionId, state.sections, state.subjects, state.uiCategory]);

  useEffect(() => {
    if (urlInitializedRef.current) return;
    urlInitializedRef.current = true;
    if (!searchParams.has('step')) {
      router.replace(`${pathname}?step=1`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    getCourses({ limit: 200 }).then((r) => {
      if (r.success && r.data) setCourses(r.data);
    });
    getBranches().then((r) => {
      if (r.success && r.data?.length) setBranches(r.data);
    });
  }, []);

  const loadPresets = useCallback(async () => {
    const response = await listBlueprintPresets();
    if (response.success && response.data) {
      setPresets(response.data);
      return;
    }
    setPresets([]);
  }, []);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  useEffect(() => {
    if (examId || draftHydratedRef.current) return;
    draftHydratedRef.current = true;
    const raw = localStorage.getItem(draftStorageKey());
    if (!raw) return;
    const d = deserializeWizardForm(raw);
    if (!d) return;
    const { step: savedDraftStep, ...rest } = d;
    dispatch({ type: 'MERGE', patch: rest });
    if (!searchParams.has('step')) {
      router.replace(`${pathname}?step=${savedDraftStep}`, { scroll: false });
    }
  }, [examId, pathname, router, searchParams]);

  useEffect(() => {
    if (examId) return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftStorageKey(),
          serializeWizardForm({ ...state, step } as ExamWizardState),
        );
      } catch {
        /* ignore quota */
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [state, step, examId]);

  const refreshServerExam = useCallback(async () => {
    if (!examId) return;
    const ex = await getExamById(examId);
    if (ex.success && ex.data) {
      setServerExam({ status: ex.data.status, pdfUrl: ex.data.pdfUrl ?? null });
    }
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    (async () => {
      setIsLoadingExam(true);
      try {
        const [ex, courseLinks, secRes, subRes] = await Promise.all([
          getExamById(examId),
          getExamCourseLinks(examId),
          getExamSections(examId),
          getExamSubjects(examId),
        ]);
        if (!ex.success || !ex.data) return;

        const basePatch = buildWizardPatchFromExam(ex.data);
        const linkedCourseIds = (
          courseLinks.success && courseLinks.data ? courseLinks.data : ex.data.examCourses || []
        )
          .map((link) => link.courseId)
          .filter((courseId) => courseId !== ex.data.courseId);
        const courseIds = [ex.data.courseId, ...linkedCourseIds];

        setServerExam({ status: ex.data.status, pdfUrl: ex.data.pdfUrl ?? null });

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
              courseIds,
              subjects: mappedSubjects,
              sections: [],
              uiCategory: 'MULTI',
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
              courseIds,
              sections: mapped,
              subjects: [],
              uiCategory: basePatch.uiCategory || inferUiCategoryFromSections(secRes.data),
            },
          });
          setActiveSectionId(mapped[0]?.localId ?? null);
          setStep1FieldErrors({});
          return;
        }

        dispatch({ type: 'MERGE', patch: { ...basePatch, courseIds } });
        setStep1FieldErrors({});
      } finally {
        setIsLoadingExam(false);
      }
    })();
  }, [examId]);

  const handlePublish = useCallback(async () => {
    if (!examId) return;
    const up = await updateExam(examId, { status: 'PUBLISHED' } as UpdateExamDto);
    if (!up.success) {
      toast({ title: 'Publish failed', description: up.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Exam published' });
    await refreshServerExam();
  }, [examId, refreshServerExam, toast]);

  useEffect(() => {
    if (initialTitle) dispatch({ type: 'MERGE', patch: { title: initialTitle } });
  }, [initialTitle]);

  const persistExam = useCallback(
    async (finalize: boolean) => {
      const primaryCourse = primaryCourseId(state.courseIds);
      if (!primaryCourse || !state.title.trim()) {
        toast({
          title: 'Missing fields',
          description: 'At least one course and a title are required.',
          variant: 'destructive',
        });
        return null;
      }
      const branchResolved =
        !state.branchId || state.branchId === EXAM_WIZARD_ALL_BRANCHES ? null : state.branchId;
      const dto: CreateExamDto = {
        courseId: primaryCourse,
        branchId: branchResolved,
        title: state.title.trim(),
        type: mapUiCategoryToExamType(state.uiCategory as UiExamCategory),
        mode: mapDeliveryToExamMode(state.deliveryMode, state.uiCategory),
        examEngine: state.uiCategory === 'MULTI' ? 'MULTI_SUBJECT' : undefined,
        durationMinutes: Number(state.durationMinutes) || 60,
        language: state.language,
        status: examId ? (serverExam?.status ?? 'DRAFT') : 'DRAFT',
        showLeaderboard: state.showLeaderboard,
        hideResult: state.hideResult,
        showPercentile: state.showPct,
        autoSubmitOnDisconnect: state.autoSubmitOnDisconnect,
        disconnectGraceSeconds: Math.max(5, Number(state.disconnectGraceSeconds) || 10),
        solveSheetVisibility: state.showSolve ? 'IMMEDIATELY' : 'HIDDEN',
        totalSets: Number(state.nSets) || 1,
        settings: {
          examWizard: {
            uiCategory: state.uiCategory,
            shuffle: state.shuffle,
            setNaming: state.setNaming,
            resultModes: state.resultModes,
            showSolve: state.showSolve,
          },
          examWorkflow: {
            method: state.uiCategory,
            submissionOwner: state.uiCategory === 'CQ' || state.uiCategory === 'MCQCQ' ? 'STUDENT' : undefined,
            writtenSubmission: state.uiCategory === 'CQ' || state.uiCategory === 'MCQCQ' ? 'CAMERA_OR_PDF' : undefined,
            resultInputModes:
              state.uiCategory === 'OFFLINE_RESULT'
                ? ['SINGLE_MANUAL', 'BULK_MANUAL', 'BULK_EXCEL']
                : state.resultModes,
            enableQrAnswerSheet: state.uiCategory === 'CQ' || state.uiCategory === 'MCQCQ',
            enablePdfCombine: state.uiCategory === 'CQ' || state.uiCategory === 'MCQCQ',
          },
        },
        resultInputModes:
          state.uiCategory === 'OFFLINE_RESULT'
            ? (['SINGLE_MANUAL', 'BULK_MANUAL', 'BULK_EXCEL'] as CreateExamDto['resultInputModes'])
            : [],
      };
      try {
        let id = examId;
        if (examId) {
          const up = await updateExam(examId, { ...dto, branchId: branchResolved } as UpdateExamDto);
          if (!up.success) {
            toast({ title: 'Update failed', description: up.message, variant: 'destructive' });
            return null;
          }
        } else {
          const cr = await createExam(dto);
          if (!cr.success || !cr.data) {
            toast({ title: 'Create failed', description: cr.message, variant: 'destructive' });
            return null;
          }
          id = cr.data.id;
        }
        if (!id) return null;

        const desiredAdditionalCourses = [...new Set(state.courseIds.slice(1).filter((courseId) => courseId && courseId !== primaryCourse))];
        const currentLinks = await getExamCourseLinks(id);
        if (currentLinks.success) {
          const currentAdditionalCourses = new Set((currentLinks.data || []).map((link) => link.courseId));
          for (const courseId of currentAdditionalCourses) {
            if (!desiredAdditionalCourses.includes(courseId)) {
              await unlinkExamCourse(id, courseId);
            }
          }
          for (const courseId of desiredAdditionalCourses) {
            if (!currentAdditionalCourses.has(courseId)) {
              await linkExamCourse(id, courseId);
            }
          }
        }

        if (state.uiCategory === 'MULTI') {
          const existingSubjects = await getExamSubjects(id);
          if (existingSubjects.success && existingSubjects.data?.length) {
            for (const sub of existingSubjects.data) {
              await deleteExamSubject(id, sub.id);
            }
          }
          for (const [index, sub] of state.subjects.entries()) {
            const questionCount =
              Number(sub.mcqSingleCount || 0) +
              Number(sub.mcqPassageCount || 0) +
              Number(sub.cqCount || 0) +
              Number(sub.shortCount || 0);
            const created = await createExamSubject(id, {
              name: sub.name.trim(),
              questionCount,
              mcqSingleCount: Number(sub.mcqSingleCount || 0),
              mcqPassageCount: Number(sub.mcqPassageCount || 0),
              cqCount: Number(sub.cqCount || 0),
              shortCount: Number(sub.shortCount || 0),
              marksPerQuestion: Number(sub.marks || 1),
              negativeMarks: Number(sub.neg || 0),
              passMarks: sub.passMarks ? Number(sub.passMarks) : undefined,
              isMandatory: sub.compulsory,
              sortOrder: index,
              folderRules: sub.folderRules.map((r) => ({
                folderId: r.folderId,
                questionCount: r.questionCount,
                selectionMode: r.selectionMode,
                excludedQuestionIds: r.excludedQuestionIds,
                pinnedQuestionIds: r.pinnedQuestionIds,
              })),
            });
            if (!created.success) {
              toast({ title: 'Subject save failed', description: created.message, variant: 'destructive' });
              return null;
            }
          }
          if (finalize) {
            const validation = await validateExamSubjects(id, Number(state.nSets) || 1);
            if (!validation.success || !validation.data?.valid) {
              toast({
                title: 'Question allocation incomplete',
                description:
                  validation.data?.errors?.[0] ?? validation.message ?? 'Check multi-subject folder allocations.',
                variant: 'destructive',
              });
              return null;
            }
            const generated = await generateFromSubjects(id, {
              setCount: Number(state.nSets) || 1,
              language: state.language === 'en' ? 'en' : 'bn',
              replaceExisting: true,
            });
            if (!generated.success) {
              toast({ title: 'Generate failed', description: generated.message, variant: 'destructive' });
              return null;
            }
          }
        } else if (state.sections.length) {
          const existing = await getExamSections(id);
          if (existing.success && existing.data?.length) {
            for (const s of existing.data) {
              await deleteExamSection(id, s.id);
            }
          }
          for (const s of state.sections) {
            const folderRules = s.folderRules.map((r) => ({
              folderId: r.folderId,
              folderName: r.folderName,
              questionCount: r.questionCount,
              selectionMode: r.selectionMode,
              excludedQuestionIds: r.excludedQuestionIds,
              pinnedQuestionIds: r.pinnedQuestionIds,
            }));
            const created = await createExamSection(id, {
              name: s.label,
              type: s.type,
              questionCount: s.count,
              mcqPassageCount: s.type === 'MCQ' ? (s.mcqPassageCount ?? 0) : 0,
              marksPerQuestion: s.marks,
              negativeMarks: s.neg,
              folderRules,
            });
            if (!created.success || !created.data) continue;
            if (finalize && s.folderRules.length) {
              const union = [...new Set(s.folderRules.map((r) => r.folderId))];
              const mergedEx = [...new Set(s.folderRules.flatMap((r) => r.excludedQuestionIds))];
              const mergedPin = s.folderRules.flatMap((r) => r.pinnedQuestionIds);
              const mode: FolderRuleDraft['selectionMode'] =
                mergedPin.length || s.folderRules.some((r) => r.selectionMode === 'MANUAL_PICK')
                  ? 'MANUAL_PICK'
                  : s.folderRules.every((r) => r.selectionMode === 'ALL_FROM_FOLDER')
                    ? 'ALL_FROM_FOLDER'
                    : 'RANDOM_COUNT';
              const generationPayload = {
                folderIds: union,
                setCount: Number(state.nSets) || 1,
                shuffleQuestions: state.shuffle !== 'ORDER',
                mcqSingleCount: s.type === 'MCQ' ? s.count : 0,
                mcqPassageCount: s.type === 'MCQ' ? (s.mcqPassageCount ?? 0) : 0,
                cqCount: s.type === 'CQ' ? s.count : 0,
                shortCount: s.type === 'SHORT' ? s.count : 0,
                marksPerQuestion: s.marks,
                negativeMarks: s.neg,
                excludedQuestionIds: mergedEx,
                pinnedQuestionIds: mergedPin,
                selectionMode: mode,
              };
              const preflight = await validateSectionGeneration(id, created.data.id, generationPayload);
              if (!preflight.success) {
                toast({
                  title: 'Question allocation gap',
                  description:
                    preflight.data?.suggestions?.[0] ??
                    preflight.message ??
                    preflight.error ??
                    'Check folder allocation and question type availability.',
                  variant: 'destructive',
                });
                return null;
              }
              const generated = await generateSectionSets(id, created.data.id, generationPayload);
              if (!generated.success) {
                toast({
                  title: 'Generate failed',
                  description: generated.message ?? generated.error ?? 'Could not generate this section.',
                  variant: 'destructive',
                });
                return null;
              }
            }
          }
        }

        toast({
          title: finalize ? 'Exam saved & sets generated' : 'Draft saved',
          variant: 'default',
        });
        return id;
      } catch {
        return null;
      }
    },
    [examId, serverExam, state, toast],
  );

  const recommendedPresetId = useMemo(() => {
    if (!selectedPrimaryCourseId) return null;
    return presets.find((preset) => preset.courseId === selectedPrimaryCourseId && preset.isDefault)?.id ?? null;
  }, [presets, selectedPrimaryCourseId]);

  const applyPreset = useCallback(
    async (presetId: string) => {
      setPresetBusy(true);
      try {
        const response = await getBlueprintPreset(presetId);
        if (!response.success || !response.data) {
          toast({
            title: 'Preset failed',
            description: response.message ?? 'Could not load preset.',
            variant: 'destructive',
          });
          return;
        }

        const patch = presetPatchFromStructure(response.data.structure as WizardPresetStructure);
        if (!patch) {
          toast({
            title: 'Preset failed',
            description: 'This preset does not contain reusable wizard settings.',
            variant: 'destructive',
          });
          return;
        }

        dispatch({ type: 'MERGE', patch });
        setAppliedPresetId(response.data.id);
        setActiveSectionId(patch.subjects?.[0]?.localId ?? patch.sections?.[0]?.localId ?? null);
        toast({ title: 'Preset applied', description: 'Review the configuration before saving.' });
      } finally {
        setPresetBusy(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (examId || appliedPresetId || !recommendedPresetId) return;
    if (state.uiCategory || state.sections.length || state.subjects.length) return;
    void applyPreset(recommendedPresetId);
  }, [
    appliedPresetId,
    applyPreset,
    examId,
    recommendedPresetId,
    state.sections.length,
    state.subjects.length,
    state.uiCategory,
  ]);

  const startBlankExam = useCallback(() => {
    const currentTitle = state.title;
    dispatch({ type: 'HYDRATE', state: { ...WIZARD_FORM_INITIAL, title: currentTitle, step } });
    setAppliedPresetId(null);
    setActiveSectionId(null);
  }, [state.title, step]);

  const savePreset = useCallback(
    async (name: string, isDefault: boolean) => {
      const courseId = primaryCourseId(state.courseIds);
      const response = await createBlueprintPreset({
        name,
        courseId: courseId || undefined,
        structure: buildPresetStructure(state),
        duration: Number(state.durationMinutes) || undefined,
        isDefault,
      });
      if (!response.success || !response.data) {
        toast({ title: 'Preset save failed', description: response.message, variant: 'destructive' });
        return null;
      }
      setAppliedPresetId(response.data.id);
      await loadPresets();
      toast({ title: 'Preset saved' });
      return response.data;
    },
    [loadPresets, state, toast],
  );

  const updatePreset = useCallback(
    async (presetId: string, isDefault: boolean) => {
      const courseId = primaryCourseId(state.courseIds);
      const response = await updateBlueprintPreset(presetId, {
        courseId: courseId || '',
        structure: buildPresetStructure(state),
        duration: Number(state.durationMinutes) || undefined,
        isDefault,
      });
      if (!response.success || !response.data) {
        toast({ title: 'Preset update failed', description: response.message, variant: 'destructive' });
        return null;
      }
      await loadPresets();
      toast({ title: 'Preset updated' });
      return response.data;
    },
    [loadPresets, state, toast],
  );

  const goSaveDraft = async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveAction('draft');
    try {
      const id = await persistExam(false);
      if (id && !examId) {
        try {
          localStorage.removeItem(draftStorageKey());
        } catch {
          /* ignore */
        }
        router.push(`/admin/exam/${id}?step=6`);
      } else if (id && examId) {
        await refreshServerExam();
        if (step !== 6) {
          router.replace(`${pathname}?step=6`, { scroll: false });
        }
      }
    } finally {
      saveInFlightRef.current = false;
      setSaveAction(null);
    }
  };

  const goFinalize = async () => {
    if (saveInFlightRef.current) return;
    if (!validateBeforeFinalize()) return;
    saveInFlightRef.current = true;
    setSaveAction('finalize');
    try {
      const id = await persistExam(true);
      if (id) {
        if (!examId) {
          try {
            localStorage.removeItem(draftStorageKey());
          } catch {
            /* ignore */
          }
        }
        if (!examId) {
          router.push(`/admin/exam/${id}?step=6`);
        } else {
          await refreshServerExam();
          if (step !== 6) {
            router.replace(`${pathname}?step=6`, { scroll: false });
          }
        }
      }
    } finally {
      saveInFlightRef.current = false;
      setSaveAction(null);
    }
  };

  const handleAddSection = (section: ReturnType<typeof buildSectionFromType>) => {
    dispatch({ type: 'ADD_SECTION', section });
    setActiveSectionId(section.localId);
  };

  const applyCategory = (id: UiExamCategory) => {
    dispatch({ type: 'APPLY_CATEGORY', category: id });
  };

  const showStep3 = state.uiCategory !== 'OMRB' && state.uiCategory !== 'OFFLINE_RESULT';
  const visibleSteps = useMemo(
    () => WIZARD_STEPS.map((label, i) => ({ label, stepNumber: i + 1 })).filter((item) => item.stepNumber !== 3 || showStep3),
    [showStep3],
  );

  const normalizeStepNumber = useCallback(
    (targetStep: number) => {
      if (!showStep3 && targetStep === 3) return 4;
      return targetStep;
    },
    [showStep3],
  );

  const currentVisibleStepIndex = Math.max(
    0,
    visibleSteps.findIndex((item) => item.stepNumber === normalizeStepNumber(step)),
  );

  const goToStep = useCallback(
    (targetStep: number) => {
      if (isLoadingExam) return;
      const normalized = normalizeStepNumber(targetStep);
      router.push(`${pathname}?step=${normalized}`, { scroll: false });
    },
    [isLoadingExam, normalizeStepNumber, pathname, router],
  );

  const goNext = () => {
    const v = validateStep(state, step);
    if (!v.ok) {
      if (step === 1 && v.step1Fields) setStep1FieldErrors(v.step1Fields);
      toast({
        title: 'Complete required fields',
        description: v.summary ?? 'Check highlighted fields.',
        variant: 'destructive',
      });
      return;
    }
    if (step === 1) setStep1FieldErrors({});
    const nextVisible = visibleSteps[currentVisibleStepIndex + 1];
    if (!nextVisible) return;
    goToStep(nextVisible.stepNumber);
  };

  const goPrev = () => {
    const prevVisible = visibleSteps[currentVisibleStepIndex - 1];
    if (!prevVisible) return;
    goToStep(prevVisible.stepNumber);
  };

  useEffect(() => {
    const normalized = normalizeStepNumber(step);
    if (normalized !== step) {
      router.replace(`${pathname}?step=${normalized}`, { scroll: false });
    }
  }, [normalizeStepNumber, pathname, router, step]);

  const openDeleteExamWizard = () => {
    if (!examId) return;
    const label = state.title.trim() || 'this exam';
    openModal({
      title: 'Delete exam',
      description: 'Removes this exam and all sections, sets, and related data.',
      className: 'sm:max-w-lg',
      content: (
        <ConfirmationModal
          title="Delete this exam?"
          description={`“${label}” will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete exam"
          variant="danger"
          onConfirm={async () => {
            try {
              const r = await deleteExam(examId);
              if (r.success) {
                try {
                  localStorage.removeItem(draftStorageKey(examId));
                } catch {
                  /* ignore */
                }
                toast({ title: 'Exam deleted', description: `“${label}” was removed.` });
                router.push('/admin/exam');
              } else {
                toast({
                  title: 'Delete failed',
                  description: r.message ?? 'Could not delete this exam.',
                  variant: 'destructive',
                });
              }
            } catch (err) {
              toast({
                title: 'Delete failed',
                description: err instanceof Error ? err.message : 'Could not delete this exam.',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  const pickerSubject = picker && state.uiCategory === 'MULTI'
    ? state.subjects.find((x) => x.localId === picker.sectionLocalId)
    : null;
  const pickerSubjectType: 'MCQ' | 'CQ' | 'SHORT' =
    pickerSubject && (pickerSubject.mcqSingleCount + pickerSubject.mcqPassageCount) > 0
      ? 'MCQ'
      : pickerSubject && pickerSubject.cqCount > 0
        ? 'CQ'
        : 'SHORT';

  const validateBeforeFinalize = () => {
    for (const item of visibleSteps) {
      if (item.stepNumber >= 6) continue;
      const validation = validateStep(state, item.stepNumber);
      if (validation.ok) continue;
      if (item.stepNumber === 1 && validation.step1Fields) setStep1FieldErrors(validation.step1Fields);
      toast({
        title: 'Complete required fields',
        description: validation.summary ?? `Complete ${item.label} before finalizing.`,
        variant: 'destructive',
      });
      goToStep(item.stepNumber);
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-0 flex-1 space-y-4 pb-8">
      {examId ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ExamEngineSubnav examId={examId} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={openDeleteExamWizard}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete exam
          </Button>
        </div>
      ) : null}
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="px-2 text-[11px] font-semibold text-slate-500">Click any step to jump and edit directly.</div>
        <div className="flex flex-wrap items-center gap-2">
          {visibleSteps.map(({ label, stepNumber: n }, i) => {
            const active = n === normalizeStepNumber(step);
            const done = i < currentVisibleStepIndex;
            const valid = validateStep(state, n).ok;
            return (
              <button
                key={label}
                type="button"
                onClick={() => goToStep(n)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors sm:text-[13px]',
                  active && 'border-b-2 border-[#C8A96E] bg-[#FBF4E6] text-[#0D1B35]',
                  done && 'cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                  !active && !done && valid && 'border-slate-200 text-slate-600 hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                  !active && !done && !valid && 'border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    active && 'bg-[#C8A96E] text-[#0D1B35]',
                    done && 'bg-emerald-600 text-white',
                    !active && !done && valid && 'bg-slate-100 text-slate-600',
                    !active && !done && !valid && 'bg-slate-50 text-slate-500',
                  )}
                >
                  {done ? '✓' : n}
                </span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoadingExam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Restoring saved exam settings...</p>
        </div>
      ) : null}

      {!isLoadingExam && step === 1 ? (
        <Step1CategoryInfo
          state={state}
          dispatch={dispatch}
          courses={courses}
          branches={branches}
          presets={presets}
          appliedPresetId={appliedPresetId}
          recommendedPresetId={recommendedPresetId}
          presetBusy={presetBusy}
          fieldErrors={step1FieldErrors}
          onSelectCategory={applyCategory}
          clearFieldError={(k) => setStep1FieldErrors((prev) => ({ ...prev, [k]: false }))}
          onStartBlank={startBlankExam}
          onApplyPreset={(id) => void applyPreset(id)}
        />
      ) : null}

      {!isLoadingExam && step === 2 ? <Step2Sections state={state} dispatch={dispatch} onAddSection={handleAddSection} /> : null}

      {!isLoadingExam && step === 3 && showStep3 ? (
        <Step3QuestionBank
          state={state}
          dispatch={dispatch}
          tree={tree}
          leaves={leaves}
          activeSectionId={activeSectionId}
          setActiveSectionId={setActiveSectionId}
          expanded={expanded}
          setExpanded={setExpanded}
          setPicker={setPicker}
          folderLoading={folderLoading}
          folderFallbackAll={folderFallbackAll}
        />
      ) : null}

      {!isLoadingExam && step === 4 ? <Step4SetsPdf state={state} dispatch={dispatch} /> : null}
      {!isLoadingExam && step === 5 ? <Step5ResultVisibility state={state} dispatch={dispatch} /> : null}
      {!isLoadingExam && step === 6 ? (
        <Step6PreviewPublish
          state={state}
          step={step}
          saveAction={saveAction}
          onSaveDraft={() => void goSaveDraft()}
          onFinalize={() => void goFinalize()}
          examId={examId}
          serverExam={serverExam}
          onPublish={() => void handlePublish()}
          onRefreshMeta={() => void refreshServerExam()}
          presets={presets}
          appliedPresetId={appliedPresetId}
          presetBusy={presetBusy}
          onSavePreset={(name, isDefault) => void savePreset(name, isDefault)}
          onUpdatePreset={(presetId, isDefault) => void updatePreset(presetId, isDefault)}
        />
      ) : null}

      <div className="h-px bg-slate-200" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={isLoadingExam || currentVisibleStepIndex <= 0} onClick={goPrev}>
          Back
        </Button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          Step {currentVisibleStepIndex + 1} / {visibleSteps.length}
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/exam" className="font-medium text-[#0D1B35] underline-offset-2 hover:underline">
            All exams
          </Link>
        </div>
        {currentVisibleStepIndex < visibleSteps.length - 1 ? (
          <Button type="button" className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]" onClick={goNext} disabled={isLoadingExam}>
            Continue
          </Button>
        ) : null}
      </div>

      <QuestionPickerModal
        open={Boolean(picker)}
        onOpenChange={(o) => !o && setPicker(null)}
        folderId={picker?.rule.folderId ?? ''}
        folderName={picker?.rule.folderName}
        questionType={
          state.uiCategory === 'MULTI'
            ? pickerSubjectType
            : (picker && state.sections.find((x) => x.localId === picker.sectionLocalId)?.type) || 'MCQ'
        }
        excludedIds={picker?.rule.excludedQuestionIds ?? []}
        pinnedIds={picker?.rule.pinnedQuestionIds ?? []}
        onSave={(next) => {
          if (!picker) return;
          dispatch({
            type: 'APPLY_PICKER',
            sectionLocalId: state.uiCategory === 'MULTI' ? undefined : picker.sectionLocalId,
            subjectLocalId: state.uiCategory === 'MULTI' ? picker.sectionLocalId : undefined,
            folderId: picker.rule.folderId,
            excludedQuestionIds: next.excludedQuestionIds,
            pinnedQuestionIds: next.pinnedQuestionIds,
            selectionMode: next.selectionMode,
          });
        }}
      />
    </div>
  );
}
