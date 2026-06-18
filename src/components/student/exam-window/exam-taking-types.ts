import type { StartAttemptResponse } from '@/types/exam';

export type AnswerPayload = Record<string, unknown>;
export type AttemptQuestion = StartAttemptResponse['questions'][number];
export type ExamDisplayItem =
  | { kind: 'single'; id: string; firstQuestionIndex: number; questions: [AttemptQuestion] }
  | { kind: 'passage'; id: string; firstQuestionIndex: number; questions: AttemptQuestion[] };
export type ExamDisplaySection = { key: string; label: string; displayIndices: number[]; questionCount: number };
export type HybridTabKey = 'mcq' | 'written';
export type DisplayItemNavMeta = {
  label: string;
  itemPosition: number;
  passagePosition?: number;
  singlePosition?: number;
};
export type DisplayTabLayout = {
  key: HybridTabKey;
  label: string;
  displayIndices: number[];
  displayIndexSet: Set<number>;
  itemCount: number;
  questionCount: number;
  passageCount: number;
  navMetaByDisplayIndex: Map<number, DisplayItemNavMeta>;
  questionNumberByItemId: Map<string, number>;
};
export type DisplayTabSummary = { answeredCount: number; flaggedCount: number };
