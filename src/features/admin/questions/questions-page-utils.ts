import type { ElementType } from 'react';
import { AlignLeft, Database, Layers, PenLine } from 'lucide-react';
import type { Difficulty, Question, QuestionType } from '@/types/question';

export type ActiveTab = 'MCQ_SIMPLE' | 'MCQ_PASSAGE' | 'CQ' | 'SHORT';

export type QuestionMetaPart = {
  label: string;
  marks: number;
  prompt: string;
  knowledgeLevel?: string | null;
};

export type QuestionMetaShape = {
  answer?: string;
  parts?: QuestionMetaPart[];
  totalMarks?: number;
};

export const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

export function getDifficultyBadgeClass(difficulty: string) {
  if (difficulty === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (difficulty === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (difficulty === 'HARD') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export function getTypeBadgeClass(type: QuestionType) {
  if (type === 'MCQ') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  if (type === 'CQ') return 'bg-violet-50 text-violet-700 border-violet-100';
  if (type === 'SHORT') return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export const TAB_CONFIG: {
  id: ActiveTab;
  label: string;
  icon: ElementType;
  description: string;
}[] = [
  { id: 'MCQ_SIMPLE', label: 'Simple MCQ', icon: Database, description: '1 question · 4 options · 1 answer' },
  { id: 'MCQ_PASSAGE', label: 'Passage MCQ', icon: Layers, description: 'Stimulus + multiple MCQs' },
  { id: 'CQ', label: 'Creative (CQ)', icon: PenLine, description: 'ক খ গ ঘ — 10 mark structure' },
  { id: 'SHORT', label: 'Short Questions', icon: AlignLeft, description: 'Direct recall · 1–3 line answer' },
];

export function stripHtml(html: string) {
  return html ? html.replace(/<[^>]+>/g, '') : '';
}

export function buildQuestionFolderActionContext(
  questionIds: string[],
  questions: Question[],
  activeFolderId?: string,
) {
  const selected = questions.filter((question) => questionIds.includes(question.id));
  const sourceFolderIds = [
    ...new Set(
      selected.length > 0
        ? selected.map((question) => question.folderId)
        : activeFolderId
          ? [activeFolderId]
          : [],
    ),
  ];
  const questionPreviews = selected
    .slice(0, 3)
    .map((question) => {
      const text = stripHtml(question.prompt).trim();
      return text.length > 96 ? `${text.slice(0, 96)}…` : text;
    })
    .filter(Boolean);

  return { sourceFolderIds, questionPreviews };
}
