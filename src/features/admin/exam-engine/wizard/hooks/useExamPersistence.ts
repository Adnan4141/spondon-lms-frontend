import { useCallback } from 'react';
import {
  createExam,
  createExamSection,
  createExamSubject,
  deleteExamSection,
  deleteExamSubject,
  generateFromSubjects,
  generateSectionSets,
  getExamSections,
  getExamSubjects,
  updateExam,
  validateExamSubjects,
  validateSectionGeneration,
} from '@/lib/api/exams';
import type { CreateExamDto, ExamStatus, UpdateExamDto } from '@/types/exam';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import type { ExamProductType, ExamWizardState, FolderRuleDraft } from '../../types';
import {
  mapProductTypeToEngine,
  mapProductTypeToExamType,
  mapToExamMode,
} from '../../types';
import { EXAM_WIZARD_ALL_BRANCHES } from '../constants';

interface Options {
  examId?: string;
  state: ExamWizardState;
  serverExam: { status: ExamStatus; pdfUrl?: string | null } | null;
  /** Effective delivery mode derived from the selected course — not stored in state. */
  effectiveDeliveryMode: 'ONLINE' | 'OFFLINE';
}

/**
 * Owns "save draft" / "finalize & generate" lifecycle for the wizard. Writes
 * every persisted axis (productType-derived ExamType, mode, OMR fields,
 * resultInputModes, solve sheet, schedule, smsNotification flag) to the
 * Exam DTO + nested settings JSON.
 */
export function useExamPersistence({ examId, state, serverExam, effectiveDeliveryMode }: Options) {
  const toast = useAdminToast();

  const persistExam = useCallback(
    async (finalize: boolean): Promise<string | null> => {
      if (!state.courseId || !state.title.trim() || !state.productType) {
        toast({
          title: 'Missing fields',
          description: 'Course, title, and exam type are all required.',
          variant: 'destructive',
        });
        return null;
      }
      const branchResolved =
        !state.branchId || state.branchId === EXAM_WIZARD_ALL_BRANCHES ? null : state.branchId;
      const productType = state.productType as ExamProductType;
      const isWritten = productType === 'WRITTEN' || productType === 'COMBINED';
      const isOmrBook =
        state.resultInputModes.includes('OMR_SCAN')
        && state.omrConfig != null
        && effectiveDeliveryMode === 'OFFLINE';
      const dto: CreateExamDto = {
        courseId: state.courseId,
        branchId: branchResolved,
        title: state.title.trim(),
        type: mapProductTypeToExamType(productType),
        mode: mapToExamMode(productType, effectiveDeliveryMode),
        examEngine: mapProductTypeToEngine(productType, isOmrBook && effectiveDeliveryMode === 'OFFLINE'),
        durationMinutes: Number(state.durationMinutes) || 60,
        language: state.language,
        status: examId ? (serverExam?.status ?? 'DRAFT') : 'DRAFT',
        showLeaderboard: state.showLeaderboard,
        hideResult: state.hideResult,
        showPercentile: state.showPct,
        autoSubmitOnDisconnect: state.autoSubmitOnDisconnect,
        disconnectGraceSeconds: Math.max(5, Number(state.disconnectGraceSeconds) || 10),
        solveSheetVisibility: state.solveVisibility,
        solveSheetScheduledAt:
          state.solveVisibility === 'SCHEDULED' && state.solveScheduledAt
            ? state.solveScheduledAt.toISOString()
            : undefined,
        startAt: state.startAt ? state.startAt.toISOString() : undefined,
        endAt: state.endAt ? state.endAt.toISOString() : undefined,
        totalSets: Number(state.nSets) || 1,
        omrQuestionCount: state.omrConfig?.questionCount ?? null,
        omrOptionCount: state.omrConfig?.optionCount ?? null,
        resultInputModes: state.resultInputModes,
        settings: {
          examWizard: {
            productType,
            deliveryMode: effectiveDeliveryMode,
            shuffle: state.shuffle,
            setNaming: state.setNaming,
            resultInputModes: state.resultInputModes,
            showSolve: state.showSolve,
            solveVisibility: state.solveVisibility,
            smsNotification: state.smsNotification,
            defaultNegativeMarks: state.defaultNegativeMarks,
            omrSheetSize: state.omrConfig?.sheetSize ?? null,
          },
          examWorkflow: {
            productType,
            deliveryMode: effectiveDeliveryMode,
            resultInputModes: state.resultInputModes,
            evaluationMode: effectiveDeliveryMode === 'OFFLINE' ? 'AGGREGATE' : 'SCRIPT_UPLOAD',
            officialResultPipeline: 'RESULT_BATCH',
            submissionOwner: isWritten && effectiveDeliveryMode === 'ONLINE' ? 'STUDENT' : 'ADMIN',
            writtenSubmission: isWritten && effectiveDeliveryMode === 'ONLINE' ? 'CAMERA_OR_PDF' : undefined,
            enableQrAnswerSheet: isWritten,
            enablePdfCombine: isWritten,
            sms: { enabled: state.smsNotification },
          },
        },
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

        if (state.productType === 'MULTI') {
          const ok = await persistMultiSubjects(id, state, finalize, toast);
          if (!ok) return null;
        } else if (state.sections.length) {
          const ok = await persistSections(id, state, finalize, toast);
          if (!ok) return null;
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
    [examId, serverExam, state, toast, effectiveDeliveryMode],
  );

  return { persistExam };
}

async function persistMultiSubjects(
  id: string,
  state: ExamWizardState,
  finalize: boolean,
  toast: ReturnType<typeof useAdminToast>,
): Promise<boolean> {
  const existingSubjects = await getExamSubjects(id);
  if (existingSubjects.success && existingSubjects.data?.length) {
    for (const sub of existingSubjects.data) {
      await deleteExamSubject(id, sub.id);
    }
  }
  for (const [index, sub] of state.subjects.entries()) {
    const questionCount =
      Number(sub.mcqSingleCount || 0)
      + Number(sub.mcqPassageCount || 0)
      + Number(sub.cqCount || 0)
      + Number(sub.shortCount || 0);
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
      return false;
    }
  }
  if (!finalize) return true;

  const validation = await validateExamSubjects(id, Number(state.nSets) || 1);
  if (!validation.success || !validation.data?.valid) {
    toast({
      title: 'Question allocation incomplete',
      description:
        validation.data?.errors?.[0] ?? validation.message ?? 'Check multi-subject folder allocations.',
      variant: 'destructive',
    });
    return false;
  }
  const generated = await generateFromSubjects(id, {
    setCount: Number(state.nSets) || 1,
    language: state.language === 'en' ? 'en' : 'bn',
    replaceExisting: true,
  });
  if (!generated.success) {
    toast({ title: 'Generate failed', description: generated.message, variant: 'destructive' });
    return false;
  }
  return true;
}

async function persistSections(
  id: string,
  state: ExamWizardState,
  finalize: boolean,
  toast: ReturnType<typeof useAdminToast>,
): Promise<boolean> {
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
            preflight.data?.suggestions?.[0]
            ?? preflight.message
            ?? preflight.error
            ?? 'Check folder allocation and question type availability.',
          variant: 'destructive',
        });
        return false;
      }
      const generated = await generateSectionSets(id, created.data.id, generationPayload);
      if (!generated.success) {
        toast({
          title: 'Generate failed',
          description: generated.message ?? generated.error ?? 'Could not generate this section.',
          variant: 'destructive',
        });
        return false;
      }
    }
  }
  return true;
}
