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
  deleteExam,
  deleteExamSection,
  generateSectionSets,
  getExamSections,
  getExamById,
  type ExamSection,
} from '@/lib/api/exams';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { CreateExamDto, ExamStatus, UpdateExamDto } from '@/types/exam';
import { QuestionPickerModal } from './components/QuestionPickerModal';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';
import {
  type ExamWizardState,
  type FolderRuleDraft,
  type UiExamCategory,
  type WizardSection,
  type SectionTypeUi,
  WIZARD_STEPS,
  mapDeliveryToExamMode,
  mapUiCategoryToExamType,
} from './types';
import { examWizardReducer, buildSectionFromType } from './wizard/examWizardReducer';
import {
  WIZARD_FORM_INITIAL,
  defaultSectionsFor,
  deserializeWizardForm,
  draftStorageKey,
  flattenFolders,
  parseStepParam,
  serializeWizardForm,
} from './wizard/wizardHelpers';
import { useExamWizardFolderTree } from './wizard/useExamWizardFolderTree';
import { validateStep, type Step1FieldKey } from './wizard/validateWizardStep';
import { Step1CategoryInfo } from './wizard/steps/Step1CategoryInfo';
import { Step2Sections } from './wizard/steps/Step2Sections';
import { Step3QuestionBank } from './wizard/steps/Step3QuestionBank';
import { Step4SetsPdf } from './wizard/steps/Step4SetsPdf';
import { Step5ResultVisibility } from './wizard/steps/Step5ResultVisibility';
import { Step6PreviewPublish } from './wizard/steps/Step6PreviewPublish';

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

  const draftHydratedRef = useRef(false);
  const urlInitializedRef = useRef(false);

  const { tree, loading: folderLoading } = useExamWizardFolderTree(state.courseId, step, 3);
  const leaves = useMemo(() => flattenFolders(tree), [tree]);

  const toast = useAdminToast();
  const { openModal } = useModalStore();

  useEffect(() => {
    dispatch({ type: 'SET_STEP', step });
  }, [step]);

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
      const ex = await getExamById(examId);
      if (ex.success && ex.data) {
        setServerExam({ status: ex.data.status, pdfUrl: ex.data.pdfUrl ?? null });
        dispatch({
          type: 'MERGE',
          patch: {
            title: ex.data.title,
            courseId: ex.data.courseId,
            branchId: ex.data.branchId ?? '',
            language: ex.data.language ?? 'bn',
            durationMinutes: String(ex.data.durationMinutes ?? 60),
            deliveryMode: ex.data.mode === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
          },
        });
      }
      const secRes = await getExamSections(examId);
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
                selectionMode: r.selectionMode ?? 'RANDOM',
                excludedQuestionIds: r.excludedQuestionIds ?? [],
                pinnedQuestionIds: r.pinnedQuestionIds ?? [],
              }))
            : [],
        }));
        dispatch({ type: 'MERGE', patch: { sections: mapped } });
        setActiveSectionId(mapped[0]?.localId ?? null);
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
      if (!state.courseId || !state.branchId || !state.title.trim()) {
        toast({
          title: 'Missing fields',
          description: 'Course, branch, and title are required.',
          variant: 'destructive',
        });
        return null;
      }
      const dto: CreateExamDto = {
        courseId: state.courseId,
        branchId: state.branchId,
        title: state.title.trim(),
        type: mapUiCategoryToExamType(state.uiCategory as UiExamCategory),
        mode: mapDeliveryToExamMode(state.deliveryMode),
        durationMinutes: Number(state.durationMinutes) || 60,
        language: state.language,
        status: examId ? (serverExam?.status ?? 'DRAFT') : 'DRAFT',
        showLeaderboard: state.showLeaderboard,
        hideResult: state.hideResult,
        showPercentile: state.showPct,
        totalSets: Number(state.nSets) || 1,
        settings: {
          examWizard: {
            uiCategory: state.uiCategory,
            shuffle: state.shuffle,
            setNaming: state.setNaming,
            instituteLabel: state.instituteLabel,
            paperCode: state.paperCode,
            resultModes: state.resultModes,
            showSolve: state.showSolve,
          },
        },
      };
      try {
        let id = examId;
        if (examId) {
          const up = await updateExam(examId, dto as UpdateExamDto);
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

        if (state.uiCategory !== 'MULTI' && state.sections.length) {
          const existing = await getExamSections(id);
          if (existing.success && existing.data?.length) {
            for (const s of existing.data) {
              await deleteExamSection(id, s.id);
            }
          }
          for (const s of state.sections) {
            const folderRules = s.folderRules.map((r) => ({
              folderId: r.folderId,
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
              const mode = mergedPin.length ? 'MANUAL' : 'RANDOM';
              await generateSectionSets(id, created.data.id, {
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
              });
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
        router.push(`/admin/exam/${id}`);
      } else if (id && examId) {
        await refreshServerExam();
      }
    } finally {
      saveInFlightRef.current = false;
      setSaveAction(null);
    }
  };

  const goFinalize = async () => {
    if (saveInFlightRef.current) return;
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
        router.push(`/admin/exam/${id}/details`);
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
    const first = defaultSectionsFor(id);
    setActiveSectionId(first[0]?.localId ?? null);
  };

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
    if (step >= 6) return;
    router.push(`${pathname}?step=${step + 1}`, { scroll: false });
  };

  const goPrev = () => {
    if (step <= 1) return;
    router.push(`${pathname}?step=${step - 1}`, { scroll: false });
  };

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

  const showStep3 = state.uiCategory !== 'MULTI' && state.uiCategory !== 'OMRB';

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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {WIZARD_STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <button
              key={label}
              type="button"
              disabled={n > step}
              onClick={() => {
                if (n < step) router.push(`${pathname}?step=${n}`, { scroll: false });
              }}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors sm:text-[13px]',
                active && 'border-b-2 border-[#C8A96E] bg-[#FBF4E6] text-[#0D1B35]',
                done && 'cursor-pointer text-emerald-700 hover:bg-emerald-50',
                !active && !done && 'text-slate-400',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  active && 'bg-[#C8A96E] text-[#0D1B35]',
                  done && 'bg-emerald-600 text-white',
                  !active && !done && 'bg-slate-100 text-slate-500',
                )}
              >
                {done ? '✓' : n}
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {step === 1 ? (
        <Step1CategoryInfo
          state={state}
          dispatch={dispatch}
          courses={courses}
          branches={branches}
          fieldErrors={step1FieldErrors}
          onSelectCategory={applyCategory}
          clearFieldError={(k) => setStep1FieldErrors((prev) => ({ ...prev, [k]: false }))}
        />
      ) : null}

      {step === 2 ? <Step2Sections state={state} dispatch={dispatch} onAddSection={handleAddSection} /> : null}

      {step === 3 && showStep3 ? (
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
        />
      ) : null}

      {step === 4 ? <Step4SetsPdf state={state} dispatch={dispatch} /> : null}
      {step === 5 ? <Step5ResultVisibility state={state} dispatch={dispatch} /> : null}
      {step === 6 ? (
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
        />
      ) : null}

      <div className="h-px bg-slate-200" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={step <= 1} onClick={goPrev}>
          Back
        </Button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          Step {step} / 6
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/exam" className="font-medium text-[#0D1B35] underline-offset-2 hover:underline">
            All exams
          </Link>
        </div>
        {step < 6 ? (
          <Button type="button" className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]" onClick={goNext}>
            Continue
          </Button>
        ) : null}
      </div>

      <QuestionPickerModal
        open={Boolean(picker)}
        onOpenChange={(o) => !o && setPicker(null)}
        folderId={picker?.rule.folderId ?? ''}
        folderName={picker?.rule.folderName}
        questionType={(picker && state.sections.find((x) => x.localId === picker.sectionLocalId)?.type) || 'MCQ'}
        excludedIds={picker?.rule.excludedQuestionIds ?? []}
        pinnedIds={picker?.rule.pinnedQuestionIds ?? []}
        onSave={(next) => {
          if (!picker) return;
          dispatch({
            type: 'APPLY_PICKER',
            sectionLocalId: picker.sectionLocalId,
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
