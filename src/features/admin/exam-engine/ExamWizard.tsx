'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useModalStore } from '@/store/modalStore';
import { ApiError } from '@/lib/api';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { deleteExam, getExamById, updateExam } from '@/lib/api/exams';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { ExamStatus, UpdateExamDto } from '@/types/exam';
import { QuestionPickerModal } from './components/QuestionPickerModal';
import {
  type ExamProductType,
  type FolderRuleDraft,
  WIZARD_STEPS,
} from './types';
import { examWizardReducer, buildSectionFromType } from './wizard/examWizardReducer';
import {
  WIZARD_FORM_INITIAL,
  draftStorageKey,
  flattenFolders,
  parseStepParam,
  wizardHasMeaningfulData,
} from './wizard/wizardHelpers';
import { useExamWizardFolderTree } from './wizard/useExamWizardFolderTree';
import { useExamHydration } from './wizard/hooks/useExamHydration';
import { useExamPersistence } from './wizard/hooks/useExamPersistence';
import { useExamPresets } from './wizard/hooks/useExamPresets';
import { useExamWizardDraft } from './wizard/hooks/useExamWizardDraft';
import { preflightExamWithBackend, validateStep, type Step1FieldKey } from './wizard/validateWizardStep';
import { fetchPreflightContext } from './wizard/fetchPreflightContext';
import { Step1CategoryInfo } from './wizard/steps/Step1CategoryInfo';
import { Step2Sections } from './wizard/steps/Step2Sections';
import { Step3QuestionBank } from './wizard/steps/Step3QuestionBank';
import { Step4SetsPdf } from './wizard/steps/Step4SetsPdf';
import { Step5ResultVisibility } from './wizard/steps/Step5ResultVisibility';
import { Step6PreviewPublish } from './wizard/steps/Step6PreviewPublish';
import { ExamWizardStepNav } from './wizard/components/ExamWizardStepNav';
import { examSetupPath, type ExamPortal } from './exam-portal-paths';
import { examWizardFooterClass } from './wizard/examWizardPageUi';

type PickerTarget = { sectionLocalId: string; rule: FolderRuleDraft } | null;

export function ExamWizard({
  examId,
  initialTitle,
  teacherUserId,
  variant = 'admin',
}: {
  examId?: string;
  initialTitle?: string;
  teacherUserId?: string;
  variant?: 'admin' | 'teacher';
}) {
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
  const [serverExam, setServerExam] = useState<{
    status: ExamStatus;
    pdfUrl?: string | null;
    solveSheetUrl?: string | null;
    setCount?: number;
  } | null>(null);

  const urlInitializedRef = useRef(false);

  const {
    tree,
    trees: folderTrees,
    loading: folderLoading,
    fallbackAll: folderFallbackAll,
  } = useExamWizardFolderTree(step, 2, teacherUserId);
  const leaves = useMemo(() => flattenFolders(tree), [tree]);

  const toast = useAdminToast();
  const { openModal } = useModalStore();

  useEffect(() => {
    dispatch({ type: 'SET_STEP', step });
  }, [step]);

  useEffect(() => {
    if (state.productType === 'MULTI') {
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
  }, [activeSectionId, state.sections, state.subjects, state.productType]);

  useEffect(() => {
    if (urlInitializedRef.current) return;
    urlInitializedRef.current = true;
    if (!searchParams.has('step')) {
      router.replace(`${pathname}?step=1`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    getCourses({
      limit: 200,
      ...(teacherUserId ? { teacherUserId, status: 'ACTIVE' as const } : {}),
    }).then((r) => {
      if (r.success && r.data) setCourses(r.data);
    });
    getBranches().then((r) => {
      if (r.success && r.data?.length) setBranches(r.data);
    });
  }, [teacherUserId]);

  const presetsApi = useExamPresets({ examId, state, dispatch, setActiveSectionId });
  const { isLoadingExam } = useExamHydration({
    examId,
    dispatch,
    setActiveSectionId,
    setServerExam,
    setStep1FieldErrors,
    teacherUserId,
  });
  const { clearDraft, hasRestoredDraft, dismissRestoredDraftBanner } = useExamWizardDraft({
    examId,
    state,
    step,
    dispatch,
    onHydratedStep: (savedStep) => {
      if (!searchParams.has('step')) {
        router.replace(`${pathname}?step=${savedStep}`, { scroll: false });
      }
    },
  });
  const { persistExam } = useExamPersistence({ examId, state, serverExam, teacherUserId });

  const refreshServerExam = useCallback(async () => {
    if (!examId) return;
    const ex = await getExamById(examId, teacherUserId ? { teacherUserId } : undefined);
    if (ex.success && ex.data) {
      setServerExam({
        status: ex.data.status,
        pdfUrl: ex.data.pdfUrl ?? null,
        solveSheetUrl: ex.data.solveSheetUrl ?? null,
        setCount: ex.data.sets?.length ?? ex.data._count?.sets ?? 0,
      });
    }
  }, [examId, teacherUserId]);

  const handlePublish = useCallback(async () => {
    if (!examId) return;
    try {
      const up = await updateExam(examId, {
        status: 'PUBLISHED',
        ...(teacherUserId ? { teacherUserId } : {}),
      } as UpdateExamDto);
      if (!up.success) {
        toast({ title: 'Publish failed', description: up.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Exam published' });
      await refreshServerExam();
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as { errors?: string[] } | undefined;
        const blockers = Array.isArray(body?.errors) ? body.errors : null;
        toast({
          title: 'Publish failed',
          description: blockers?.length ? blockers.join(' ') : error.message,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Publish failed', description: 'Could not publish this exam.', variant: 'destructive' });
    }
  }, [examId, refreshServerExam, teacherUserId, toast]);

  useEffect(() => {
    if (initialTitle) dispatch({ type: 'MERGE', patch: { title: initialTitle } });
  }, [initialTitle]);

  const resetWizardForm = useCallback(() => {
    clearDraft();
    dismissRestoredDraftBanner();
    dispatch({ type: 'HYDRATE', state: { ...WIZARD_FORM_INITIAL, step: 1 } });
    presetsApi.startBlankExam();
    setStep1FieldErrors({});
    setActiveSectionId(null);
    router.replace(`${pathname}?step=1`, { scroll: false });
    toast({ title: 'Form reset', description: 'All unsaved wizard data was cleared.' });
  }, [clearDraft, dismissRestoredDraftBanner, dispatch, pathname, presetsApi, router, toast]);

  const startBlankExam = useCallback(() => {
    clearDraft();
    dismissRestoredDraftBanner();
    dispatch({ type: 'HYDRATE', state: { ...WIZARD_FORM_INITIAL, step: 1 } });
    presetsApi.startBlankExam();
    setStep1FieldErrors({});
    setActiveSectionId(null);
  }, [clearDraft, dismissRestoredDraftBanner, dispatch, presetsApi]);

  const openResetWizard = useCallback(() => {
    openModal({
      title: 'Reset form',
      description: 'Clears all unsaved wizard data from this device.',
      className: 'sm:max-w-lg',
      content: (
        <ConfirmationModal
          title="Reset this exam form?"
          description="All unsaved fields, sections, and local draft data will be cleared. This cannot be undone."
          confirmLabel="Reset form"
          variant="danger"
          onConfirm={async () => {
            resetWizardForm();
          }}
        />
      ),
    });
  }, [openModal, resetWizardForm]);

  const canResetWizard = !examId && wizardHasMeaningfulData(state);

  const portal: ExamPortal = variant === 'teacher' ? 'teacher' : 'admin';

  const goSaveDraft = async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveAction('draft');
    try {
      const id = await persistExam(false);
      if (id && !examId) {
        clearDraft();
        router.push(`${examSetupPath(portal, id)}?step=6`);
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
    if (!(await validateBeforeFinalize())) return;
    saveInFlightRef.current = true;
    setSaveAction('finalize');
    try {
      const id = await persistExam(true);
      if (id) {
        if (!examId) {
          clearDraft();
          router.push(`${examSetupPath(portal, id)}?step=6`);
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

  const applyProductType = (id: ExamProductType) => {
    dispatch({ type: 'APPLY_PRODUCT_TYPE', productType: id });
  };

  /**
   * Step 3 (Question bank) is required for every exam product type — all papers
   * pull MCQ/CQ/SHORT from the bank before sets/PDF are generated.
   */
  const showStep3 = Boolean(state.productType);
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
    const v = validateStep(state, step, state.deliveryMode);
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
              const r = await deleteExam(examId, teacherUserId ? { teacherUserId } : undefined);
              if (r.success) {
                try {
                  localStorage.removeItem(draftStorageKey(examId));
                } catch {
                  /* ignore */
                }
                toast({ title: 'Exam deleted', description: `“${label}” was removed.` });
                router.push(variant === 'teacher' ? '/teacher/exams' : '/admin/exam');
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

  const pickerSubject = picker && state.productType === 'MULTI'
    ? state.subjects.find((x) => x.localId === picker.sectionLocalId)
    : null;
  const pickerSubjectType: 'MCQ' | 'CQ' | 'SHORT' =
    pickerSubject && (pickerSubject.mcqSingleCount + pickerSubject.mcqPassageCount) > 0
      ? 'MCQ'
      : pickerSubject && pickerSubject.cqCount > 0
        ? 'CQ'
        : 'SHORT';

  const validateBeforeFinalize = async (): Promise<boolean> => {
    for (const item of visibleSteps) {
      if (item.stepNumber >= 6) continue;
      const validation = validateStep(state, item.stepNumber, state.deliveryMode);
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
    const preflight = await preflightExamWithBackend(
      state,
      await fetchPreflightContext(state),
      state.deliveryMode,
    );
    if (!preflight.ok) {
      const first = preflight.errors[0];
      toast({
        title: 'Cannot finalize yet',
        description: first?.message ?? 'Resolve the highlighted issues before finalizing.',
        variant: 'destructive',
      });
      if (first?.step) goToStep(first.step);
      return false;
    }
    for (const warning of preflight.warnings) {
      toast({ title: 'Heads up', description: warning.message, variant: 'default' });
    }
    return true;
  };

  const stepShellClass = 'w-full max-w-full min-w-0';

  return (
    <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col gap-4 pb-4">
      {examId ? (
        <div className="flex justify-end">
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
      <ExamWizardStepNav
        steps={visibleSteps}
        activeStep={normalizeStepNumber(step)}
        currentIndex={currentVisibleStepIndex}
        onStepClick={goToStep}
        isStepValid={(n) => validateStep(state, n, state.deliveryMode).ok}
      />

      {!examId && hasRestoredDraft && !isLoadingExam ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Unsaved work was restored from your last session on this device.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white hover:bg-amber-50"
              onClick={dismissRestoredDraftBanner}
            >
              Continue editing
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={openResetWizard}
            >
              Reset
            </Button>
          </div>
        </div>
      ) : null}

      {isLoadingExam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0D1B35]" />
          <p className="text-sm font-semibold text-slate-500">Restoring saved exam settings...</p>
        </div>
      ) : null}

      {!isLoadingExam && step === 1 ? (
        <div className={stepShellClass}>
          <Step1CategoryInfo
            state={state}
            dispatch={dispatch}
            courses={courses}
            branches={branches}
            presets={presetsApi.presets}
            appliedPresetId={presetsApi.appliedPresetId}
            recommendedPresetId={presetsApi.recommendedPresetId}
            presetBusy={presetsApi.presetBusy}
            deliveryMode={state.deliveryMode}
            fieldErrors={step1FieldErrors}
            onSelectProductType={applyProductType}
            clearFieldError={(k) => setStep1FieldErrors((prev) => ({ ...prev, [k]: false }))}
            onStartBlank={startBlankExam}
            onApplyPreset={(id) => void presetsApi.applyPreset(id)}
            wizardVariant={variant}
          />
        </div>
      ) : null}

      {!isLoadingExam && step === 2 ? (
        <div className={stepShellClass}>
          <Step2Sections
            state={state}
            dispatch={dispatch}
            onAddSection={handleAddSection}
            deliveryMode={state.deliveryMode}
            folderTrees={folderTrees}
          />
        </div>
      ) : null}

      {!isLoadingExam && step === 3 && showStep3 ? (
        <div className={stepShellClass}>
          <Step3QuestionBank
            state={state}
            dispatch={dispatch}
            tree={tree}
            trees={folderTrees}
            leaves={leaves}
            activeSectionId={activeSectionId}
            setActiveSectionId={setActiveSectionId}
            expanded={expanded}
            setExpanded={setExpanded}
            setPicker={setPicker}
            folderLoading={folderLoading}
            folderFallbackAll={folderFallbackAll}
          />
        </div>
      ) : null}

      {!isLoadingExam && step === 4 ? (
        <div className={stepShellClass}>
          <Step4SetsPdf state={state} dispatch={dispatch} />
        </div>
      ) : null}
      {!isLoadingExam && step === 5 ? (
        <div className={stepShellClass}>
          <Step5ResultVisibility state={state} dispatch={dispatch} deliveryMode={state.deliveryMode} />
        </div>
      ) : null}
      {!isLoadingExam && step === 6 ? (
        <div className={stepShellClass}>
          <Step6PreviewPublish
            state={state}
            dispatch={dispatch}
            step={step}
            saveAction={saveAction}
            onSaveDraft={() => void goSaveDraft()}
            onFinalize={() => void goFinalize()}
            examId={examId}
            serverExam={serverExam}
            onPublish={() => void handlePublish()}
            onRefreshMeta={() => void refreshServerExam()}
            presets={presetsApi.presets}
            appliedPresetId={presetsApi.appliedPresetId}
            presetBusy={presetsApi.presetBusy}
            onSavePreset={(name, isDefault) => void presetsApi.savePreset(name, isDefault)}
            onUpdatePreset={(presetId, isDefault) => void presetsApi.updatePreset(presetId, isDefault)}
            deliveryMode={state.deliveryMode}
            portal={portal}
          />
        </div>
      ) : null}

      <div className={cn(examWizardFooterClass, 'mt-auto')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled={isLoadingExam || currentVisibleStepIndex <= 0} onClick={goPrev}>
              Back
            </Button>
            {!examId ? (
              <Button
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                disabled={isLoadingExam || !canResetWizard}
                onClick={openResetWizard}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {currentVisibleStepIndex + 1} / {visibleSteps.length}
            </span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Link href="/admin/exam" className="font-medium text-[#0D1B35] underline-offset-2 hover:underline">
              All exams
            </Link>
          </div>
          {currentVisibleStepIndex < visibleSteps.length - 1 ? (
            <Button
              type="button"
              className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]"
              onClick={goNext}
              disabled={isLoadingExam}
            >
              Continue
            </Button>
          ) : null}
        </div>
      </div>

      <QuestionPickerModal
        open={Boolean(picker)}
        onOpenChange={(o) => !o && setPicker(null)}
        folderId={picker?.rule.folderId ?? ''}
        folderName={picker?.rule.folderName}
        questionType={
          state.productType === 'MULTI'
            ? pickerSubjectType
            : (picker && state.sections.find((x) => x.localId === picker.sectionLocalId)?.type) || 'MCQ'
        }
        excludedIds={picker?.rule.excludedQuestionIds ?? []}
        pinnedIds={picker?.rule.pinnedQuestionIds ?? []}
        onSave={(next) => {
          if (!picker) return;
          dispatch({
            type: 'APPLY_PICKER',
            sectionLocalId: state.productType === 'MULTI' ? undefined : picker.sectionLocalId,
            subjectLocalId: state.productType === 'MULTI' ? picker.sectionLocalId : undefined,
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
