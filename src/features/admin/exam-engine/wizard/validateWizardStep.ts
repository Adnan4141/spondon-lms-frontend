import type { ExamWizardState, FolderRuleDraft } from '../types';
import { preflightFolderRules, type FolderPreflightRule } from '@/lib/api/question-bank';

export type Step1FieldKey = 'productType' | 'title' | 'courseId';

export type ValidationLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: ValidationLevel;
  message: string;
  /** Optional step that the user should be jumped to in order to fix this. */
  step?: number;
}

export interface StepValidation {
  ok: boolean;
  /** Human-readable summary when blocking Continue */
  summary?: string;
  /** Step 1 inline field flags */
  step1Fields?: Partial<Record<Step1FieldKey, boolean>>;
  /** Structured issues (errors block, warnings are advisory). */
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

function ok(): StepValidation {
  return { ok: true, errors: [], warnings: [] };
}

function fail(summary: string, step?: number, step1Fields?: Partial<Record<Step1FieldKey, boolean>>): StepValidation {
  return {
    ok: false,
    summary,
    step1Fields,
    errors: [{ level: 'error', message: summary, step }],
    warnings: [],
  };
}

export function validateStep(
  state: ExamWizardState,
  step: number,
  deliveryMode: 'ONLINE' | 'OFFLINE' = 'ONLINE',
): StepValidation {
  if (step === 1) {
    const step1Fields: Partial<Record<Step1FieldKey, boolean>> = {
      productType: !state.productType,
      title: state.title.trim().length <= 2,
      courseId: !state.courseId,
    };
    const attempts = Number(state.allowedAttempts);
    const attemptsInvalid =
      deliveryMode === 'ONLINE'
      && (!Number.isFinite(attempts) || attempts < 1 || attempts > 10);
    const passed = !step1Fields.productType && !step1Fields.title && !step1Fields.courseId && !attemptsInvalid;
    if (passed) return ok();
    const parts: string[] = [];
    if (step1Fields.productType) parts.push('exam type');
    if (step1Fields.title) parts.push('title (min 3 characters)');
    if (step1Fields.courseId) parts.push('course');
    if (attemptsInvalid) parts.push('allowed attempts (1–10)');
    const summary = `Please complete: ${parts.join(', ')}.`;
    return {
      ok: false,
      summary,
      step1Fields,
      errors: [{ level: 'error', message: summary, step: 1 }],
      warnings: [],
    };
  }

  if (step === 2) {
    if (state.productType === 'MULTI') {
      if (state.subjects.length === 0) return fail('Add at least one subject for multi-subject exams.', 2);
      for (const sub of state.subjects) {
        if (!sub.name.trim()) return fail('Every subject needs a name.', 2);
        const total =
          Number(sub.mcqSingleCount || 0)
          + Number(sub.mcqPassageCount || 0)
          + Number(sub.cqCount || 0)
          + Number(sub.shortCount || 0);
        if (total < 1) return fail(`Subject "${sub.name}" needs at least 1 question.`, 2);
        if (total > 500) return fail(`Subject "${sub.name}" exceeds the 500 question limit.`, 2);
        if (sub.compulsory) {
          const passMarks = Number(sub.passMarks);
          if (!Number.isFinite(passMarks) || passMarks <= 0) {
            return fail(`Mandatory subject "${sub.name || 'Untitled'}" needs pass marks greater than 0.`, 2);
          }
        }
      }
      return ok();
    }

    const isManualOffline =
      deliveryMode === 'OFFLINE'
      && !state.resultInputModes.includes('AUTOMATED')
      && !state.resultInputModes.includes('OMR_SCAN');
    if (isManualOffline) return ok();
    if (state.sections.length === 0) return fail('Add at least one section.', 2);
    for (const s of state.sections) {
      const n = Number(s.count);
      if (!Number.isFinite(n) || n < 1) {
        return fail(`Section "${s.label || s.type}" needs at least 1 question slot.`, 2);
      }
      if (n > 500) return fail(`Section "${s.label || s.type}" exceeds the 500 slot limit.`, 2);
      if (s.type === 'MCQ') {
        const pg = Math.max(0, s.mcqPassageCount ?? 0);
        if (pg > 500) return fail(`Section "${s.label || 'MCQ'}" has an invalid passage block count.`, 2);
        if (pg > n) {
          return fail(`Section "${s.label || 'MCQ'}": whole passage blocks (${pg}) cannot exceed total slots (${n}).`, 2);
        }
      }
    }
    return ok();
  }

  if (step === 3) {
    if (state.productType === 'MULTI') {
      for (const sub of state.subjects) {
        if (!sub.folderRules.length) return fail(`Add at least one folder for "${sub.name}".`, 3);
        const allocated = sub.folderRules.reduce((sum, r) => sum + Number(r.questionCount || 0), 0);
        if (allocated < sub.count) {
          return fail(`"${sub.name}" needs ${sub.count} questions but only ${allocated} allocated.`, 3);
        }
        if (allocated > sub.count) {
          return fail(`"${sub.name}" is over-allocated (${allocated}/${sub.count}).`, 3);
        }
      }
      return ok();
    }
    for (const s of state.sections) {
      if (!s.folderRules.length) return fail(`Add at least one folder for "${s.label || s.type}".`, 3);
      const allocated = s.folderRules.reduce((sum, r) => sum + Number(r.questionCount || 0), 0);
      if (allocated < s.count) {
        return fail(
          `"${s.label || s.type}" needs ${s.count} questions but only ${allocated} allocated across folders.`,
          3,
        );
      }
    }
    return ok();
  }

  if (step === 4) {
    const nSets = Number(state.nSets);
    if (!Number.isFinite(nSets) || nSets < 1 || nSets > 26) {
      return fail('Number of sets must be between 1 and 26.', 4);
    }
    const validShuffle = new Set(['FULL', 'ORDER', 'OPTS', 'MIXED']);
    if (!validShuffle.has(state.shuffle)) {
      return fail('Pick a valid shuffle mode.', 4);
    }
    if (state.productType === 'WRITTEN' && (state.shuffle === 'OPTS' || state.shuffle === 'MIXED')) {
      return fail('Written exams support order shuffle only — not option shuffling.', 4);
    }
    return ok();
  }

  if (step === 5) {
    if (!state.resultInputModes.length) {
      return fail('Pick at least one result-entry method.', 5);
    }
    return ok();
  }

  if (step === 6) {
    return ok();
  }

  return ok();
}

export function canAdvance(
  state: ExamWizardState,
  step: number,
  deliveryMode: 'ONLINE' | 'OFFLINE' = 'ONLINE',
): boolean {
  return validateStep(state, step, deliveryMode).ok;
}

/**
 * Whole-exam preflight invoked by `goFinalize`. Returns blocking errors and
 * advisory warnings without short-circuiting on the first miss, so the
 * admin sees the full set of issues at once.
 */
export interface PreflightContext {
  /** Total students linked to the primary course/branch (for SMS warnings). */
  totalLinkedStudents?: number;
  /** Number of those linked students with a mobile on file. */
  studentsWithMobile?: number;
}

export interface PreflightResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Build the rule payload sent to `/folders/preflight`. Skips rows that
 * don't yet have a folder id so partially-typed entries don't block the
 * wizard.
 */
function rulesToPreflightPayload(state: ExamWizardState): FolderPreflightRule[] {
  const rules: FolderPreflightRule[] = [];
  const push = (rule: FolderRuleDraft, type: 'MCQ' | 'CQ' | 'SHORT') => {
    if (!rule.folderId) return;
    // Map legacy selection modes (RANDOM/MANUAL) to the current canonical set
    // expected by /folders/preflight.
    const mode = rule.selectionMode;
    const normalisedMode: 'RANDOM_COUNT' | 'ALL_FROM_FOLDER' | 'MANUAL_PICK' =
      mode === 'ALL_FROM_FOLDER' || mode === 'MANUAL_PICK' || mode === 'RANDOM_COUNT'
        ? mode
        : mode === 'MANUAL'
          ? 'MANUAL_PICK'
          : 'RANDOM_COUNT';
    rules.push({
      folderId: rule.folderId,
      questionType: type,
      questionCount: Number(rule.questionCount || 0),
      selectionMode: normalisedMode,
      excludedQuestionIds: rule.excludedQuestionIds ?? [],
      pinnedQuestionIds: rule.pinnedQuestionIds ?? [],
    });
  };

  if (state.productType === 'MULTI') {
    for (const subject of state.subjects) {
      const typeNeeds = [
        { type: 'MCQ' as const, count: Number(subject.mcqSingleCount || 0) + Number(subject.mcqPassageCount || 0) },
        { type: 'CQ' as const, count: Number(subject.cqCount || 0) },
        { type: 'SHORT' as const, count: Number(subject.shortCount || 0) },
      ].filter((row) => row.count > 0);

      for (const need of typeNeeds) {
        const totalAllocated = subject.folderRules.reduce((sum, rule) => sum + Number(rule.questionCount || 0), 0);
        let distributed = 0;
        subject.folderRules.forEach((rule, index) => {
          const isLast = index === subject.folderRules.length - 1;
          const portion = isLast
            ? Math.max(0, need.count - distributed)
            : totalAllocated > 0
              ? Math.floor(need.count * (Number(rule.questionCount || 0) / totalAllocated))
              : index === 0
                ? need.count
                : 0;
          if (portion > 0) {
            push({ ...rule, questionCount: portion }, need.type);
            distributed += portion;
          }
        });
      }
    }
  } else {
    for (const section of state.sections) {
      section.folderRules.forEach((r) => push(r, section.type));
    }
  }
  return rules;
}

export function preflightExam(
  state: ExamWizardState,
  ctx: PreflightContext = {},
  deliveryMode: 'ONLINE' | 'OFFLINE' = 'ONLINE',
): PreflightResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Run per-step validation up to (but not including) step 6.
  for (const step of [1, 2, 3, 4, 5] as const) {
    const result = validateStep(state, step, deliveryMode);
    if (!result.ok) {
      errors.push(...result.errors);
    }
  }

  // Schedule consistency.
  if (state.startAt && state.endAt && state.startAt.getTime() >= state.endAt.getTime()) {
    errors.push({ level: 'error', message: 'Start time must be before end time.', step: 6 });
  }
  if (state.endAt && state.endAt.getTime() < Date.now()) {
    warnings.push({ level: 'warning', message: 'End time is in the past — students will not be able to attempt.', step: 6 });
  }

  // Result-mode validity for the chosen type / course delivery.
  if (state.productType) {
    const modes = state.resultInputModes;
    if (modes.includes('AUTOMATED') && deliveryMode !== 'ONLINE') {
      errors.push({
        level: 'error',
        message: 'Automatic grading requires Online delivery.',
        step: 5,
      });
    }
    if (modes.includes('OMR_SCAN')) {
      if (deliveryMode !== 'OFFLINE') {
        errors.push({ level: 'error', message: 'OMR scan requires Offline delivery.', step: 5 });
      }
      if (state.productType === 'WRITTEN') {
        errors.push({ level: 'error', message: 'OMR scan is not supported for Written exams.', step: 5 });
      }
      if (!state.omrConfig) {
        errors.push({ level: 'error', message: 'Configure the OMR sheet (size + question count) in step 1.', step: 1 });
      } else {
        if (state.omrConfig.questionCount < 25 || state.omrConfig.questionCount > 200) {
          errors.push({ level: 'error', message: 'OMR sheet supports 25–200 questions.', step: 1 });
        }
        if (![3, 4, 5].includes(state.omrConfig.optionCount)) {
          errors.push({ level: 'error', message: 'OMR options must be 3, 4, or 5.', step: 1 });
        }
      }
    }
  }

  // OMR parity: MCQ totals should match omrQuestionCount.
  if (state.omrConfig && state.resultInputModes.includes('OMR_SCAN')) {
    const mcqTotal =
      state.productType === 'MULTI'
        ? state.subjects.reduce((sum, sub) => sum + Number(sub.mcqSingleCount || 0) + Number(sub.mcqPassageCount || 0), 0)
        : state.sections
            .filter((s) => s.type === 'MCQ')
            .reduce((sum, s) => sum + Number(s.count || 0), 0);
    if (mcqTotal && mcqTotal !== state.omrConfig.questionCount) {
      errors.push({
        level: 'error',
        message: `OMR sheet expects ${state.omrConfig.questionCount} MCQ slots, but sections/subjects total ${mcqTotal}.`,
        step: state.productType === 'MULTI' ? 2 : 2,
      });
    }
  }

  // Scheduled solve-sheet release sanity.
  if (state.solveVisibility === 'SCHEDULED' && !state.solveScheduledAt) {
    errors.push({ level: 'error', message: 'Set the date/time when the solve sheet should become visible.', step: 5 });
  }
  if (
    state.solveVisibility === 'SCHEDULED'
    && state.solveScheduledAt
    && state.endAt
    && state.solveScheduledAt.getTime() < state.endAt.getTime()
  ) {
    warnings.push({
      level: 'warning',
      message: 'Solve sheet is scheduled to appear before the exam end time — students may see answers before submitting.',
      step: 5,
    });
  }

  // SMS prerequisites.
  if (state.smsNotification) {
    if (ctx.totalLinkedStudents != null && ctx.studentsWithMobile != null) {
      const missing = ctx.totalLinkedStudents - ctx.studentsWithMobile;
      if (missing > 0) {
        warnings.push({
          level: 'warning',
          message: `${missing} linked student${missing === 1 ? ' has' : 's have'} no mobile number — they will not receive result SMS.`,
          step: 5,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Awaitable preflight that runs the synchronous {@link preflightExam} and then
 * adds backend folder-rule feasibility checks. Called from `goFinalize` so an
 * admin can't reach paper generation without proving every random pull will
 * succeed against the live question bank.
 *
 * Network failures degrade gracefully — they're surfaced as warnings (not
 * errors) so a flaky connection doesn't block legitimate publishes.
 */
export async function preflightExamWithBackend(
  state: ExamWizardState,
  ctx: PreflightContext = {},
  deliveryMode: 'ONLINE' | 'OFFLINE' = 'ONLINE',
): Promise<PreflightResult> {
  const sync = preflightExam(state, ctx, deliveryMode);
  const errors = [...sync.errors];
  const warnings = [...sync.warnings];

  const rules = rulesToPreflightPayload(state);
  if (rules.length === 0) {
    return { ok: errors.length === 0, errors, warnings };
  }

  try {
    const response = await preflightFolderRules({ rules });
    if (response.success && response.data) {
      for (const row of response.data.rows) {
        if (!row.fits) {
          errors.push({
            level: 'error',
            message: row.reason ?? `Folder rule #${row.index + 1} cannot be satisfied.`,
            step: 3,
          });
        }
      }
    } else {
      warnings.push({
        level: 'warning',
        message: response.message ?? 'Could not verify folder availability — proceed with caution.',
        step: 3,
      });
    }
  } catch (e: unknown) {
    warnings.push({
      level: 'warning',
      message: `Folder preflight unavailable: ${e instanceof Error ? e.message : 'network error'}.`,
      step: 3,
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}
