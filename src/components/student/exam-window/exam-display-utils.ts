import type { StartAttemptResponse, WrittenSubmissionPage } from '@/types/exam';
import type {
  AnswerPayload,
  AttemptQuestion,
  DisplayItemNavMeta,
  DisplayTabLayout,
  DisplayTabSummary,
  ExamDisplayItem,
  ExamDisplaySection,
  HybridTabKey,
} from './exam-taking-types';

export function formatSectionLabel(rawKey: string | null | undefined, questionType?: string | null): string {
  const normalizedKey = String(rawKey || '').trim().toLowerCase();
  if (normalizedKey === 'mcq') return 'MCQ';
  if (normalizedKey === 'cq' || normalizedKey === 'short' || normalizedKey === 'written') return 'Written';
  if (normalizedKey) {
    return normalizedKey
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
  if (questionType === 'MCQ') return 'MCQ';
  return 'Written';
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || typeof window === 'undefined') return file;
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = imageUrl;
    });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.76));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function writtenPages(answer?: AnswerPayload): WrittenSubmissionPage[] {
  const meta = answer?.writtenSubmission as { pages?: WrittenSubmissionPage[] } | undefined;
  return Array.isArray(meta?.pages) ? meta.pages : [];
}

export function writtenFinalPdf(answer?: AnswerPayload): string | null {
  const meta = answer?.writtenSubmission as { finalPdfUrl?: string | null } | undefined;
  return meta?.finalPdfUrl ?? null;
}

export function inferExamFlow(questions: StartAttemptResponse['questions']): 'MCQ_ONLY' | 'WRITTEN_ONLY' | 'MIXED' {
  const types = new Set(questions.map((q) => q.question?.type).filter(Boolean) as string[]);
  const hasMcq = types.has('MCQ');
  const hasWritten = types.has('CQ') || types.has('SHORT');
  if (hasMcq && hasWritten) return 'MIXED';
  if (hasMcq) return 'MCQ_ONLY';
  return 'WRITTEN_ONLY';
}

export function buildDisplayItems(questions: AttemptQuestion[]): ExamDisplayItem[] {
  return questions.map((q, index) => ({ kind: 'single', id: q.id, firstQuestionIndex: index, questions: [q] }));
}

export function sectionIdentityForQuestion(q: AttemptQuestion): { key: string; label: string } {
  const rawKey =
    (q.sectionKey && String(q.sectionKey)) ||
    (q.question?.type === 'MCQ' ? 'mcq' : 'written');
  return {
    key: rawKey,
    label: formatSectionLabel(rawKey, q.question?.type ?? null),
  };
}

export function buildDisplaySections(
  items: ExamDisplayItem[],
  questions: AttemptQuestion[],
  sourceSections?: StartAttemptResponse['sections'],
): ExamDisplaySection[] {
  const questionIndexById = new Map(questions.map((question, index) => [question.id, index]));
  const displayIndexByQuestionIndex = new Map<number, number>();

  items.forEach((item, displayIndex) => {
    item.questions.forEach((question) => {
      const questionIndex = questionIndexById.get(question.id);
      if (questionIndex != null) {
        displayIndexByQuestionIndex.set(questionIndex, displayIndex);
      }
    });
  });

  if (sourceSections?.length) {
    const derived = sourceSections
      .map((section) => {
        const displayIndices = Array.from(
          new Set(
            section.questionIndices
              .map((questionIndex) => displayIndexByQuestionIndex.get(questionIndex))
              .filter((displayIndex): displayIndex is number => displayIndex != null),
          ),
        );
        if (!displayIndices.length) return null;
        const firstQuestionIndex = section.questionIndices.find((questionIndex) =>
          displayIndexByQuestionIndex.has(questionIndex),
        );
        const firstQuestion =
          firstQuestionIndex != null && firstQuestionIndex >= 0 ? questions[firstQuestionIndex] : undefined;
        return {
          key: String(section.key || firstQuestion?.sectionKey || firstQuestion?.question?.type || 'written'),
          label: formatSectionLabel(section.label || section.key, firstQuestion?.question?.type ?? null),
          displayIndices,
          questionCount: section.questionIndices.length,
        } satisfies ExamDisplaySection;
      })
      .filter(Boolean) as ExamDisplaySection[];
    if (derived.length) return derived;
  }

  const sections: ExamDisplaySection[] = [];
  items.forEach((item, displayIndex) => {
    const firstQuestion = item.questions[0];
    if (!firstQuestion) return;
    const { key, label } = sectionIdentityForQuestion(firstQuestion);
    const lastSection = sections[sections.length - 1];
    if (lastSection && lastSection.key === key) {
      lastSection.displayIndices.push(displayIndex);
      lastSection.questionCount += item.questions.length;
      return;
    }
    sections.push({
      key,
      label,
      displayIndices: [displayIndex],
      questionCount: item.questions.length,
    });
  });

  return sections;
}

export function displayItemTabKey(item: ExamDisplayItem): HybridTabKey {
  const firstQuestion = item.questions[0];
  return firstQuestion?.question?.type === 'MCQ' ? 'mcq' : 'written';
}

export function createDisplayTabLayout(key: HybridTabKey): DisplayTabLayout {
  return {
    key,
    label: key === 'mcq' ? 'MCQ' : 'Written',
    displayIndices: [],
    displayIndexSet: new Set<number>(),
    itemCount: 0,
    questionCount: 0,
    passageCount: 0,
    navMetaByDisplayIndex: new Map<number, DisplayItemNavMeta>(),
    questionNumberByItemId: new Map<string, number>(),
  };
}

export function buildDisplayTabLayouts(items: ExamDisplayItem[]): Record<HybridTabKey, DisplayTabLayout> {
  const layouts: Record<HybridTabKey, DisplayTabLayout> = {
    mcq: createDisplayTabLayout('mcq'),
    written: createDisplayTabLayout('written'),
  };
  items.forEach((item, displayIndex) => {
    const tabKey = displayItemTabKey(item);
    const layout = layouts[tabKey];
    layout.displayIndices.push(displayIndex);
    layout.displayIndexSet.add(displayIndex);
    layout.itemCount += 1;

    item.questions.forEach((question) => {
      const nextNumber = layout.questionNumberByItemId.size + 1;
      layout.questionNumberByItemId.set(question.id, nextNumber);
      layout.questionCount += 1;
    });

    layout.navMetaByDisplayIndex.set(displayIndex, {
      label: String(layout.questionCount),
      itemPosition: layout.itemCount,
      singlePosition: layout.questionCount,
    });
  });

  return layouts;
}

export function isQuestionAnswered(q: AttemptQuestion, answers: Record<string, AnswerPayload>): boolean {
  const answer = answers[q.questionId];
  if (!answer) return false;
  if (answer.selectedOptionId) return true;
  if (typeof answer.text === 'string' && answer.text.trim()) return true;
  if (writtenPages(answer).length > 0) return true;
  return false;
}

export function displayItemAnswered(item: ExamDisplayItem, answers: Record<string, AnswerPayload>): boolean {
  return item.questions.every((q) => isQuestionAnswered(q, answers));
}

export function displayItemFlagged(item: ExamDisplayItem, answers: Record<string, AnswerPayload>): boolean {
  return item.questions.some((q) => !!answers[q.questionId]?.markedForReview);
}

export function summarizeDisplayTab(
  layout: DisplayTabLayout,
  items: ExamDisplayItem[],
  answers: Record<string, AnswerPayload>,
): DisplayTabSummary {
  let answeredCount = 0;
  let flaggedCount = 0;

  layout.displayIndices.forEach((displayIndex) => {
    const item = items[displayIndex];
    if (!item) return;
    item.questions.forEach((question) => {
      if (isQuestionAnswered(question, answers)) answeredCount += 1;
      if (answers[question.questionId]?.markedForReview) flaggedCount += 1;
    });
  });

  return { answeredCount, flaggedCount };
}
