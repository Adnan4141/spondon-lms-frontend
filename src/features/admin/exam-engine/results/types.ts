import type { ExamAnalytics } from '@/lib/api/exams';

export type BranchOption = { id: string; name: string };

export type MeritRow = Record<string, unknown>;

export type WrittenAttemptRow = {
  id: string;
  student?: { fullName?: string };
  evaluationStatus?: string;
  totalAwarded?: number;
};

export type CqPartMeta = {
  label: string;
  marks?: number;
  prompt?: string;
};

export type WrittenAttemptQuestion = {
  questionId: string;
  marks: number;
  question?: { prompt?: string; meta?: { parts?: CqPartMeta[] } | null };
  studentAnswer?: {
    id: string;
    obtainedMarks?: number | null;
    evaluations?: Array<{ subPartKey?: string | null; marksAwarded?: number | null }>;
    writtenSubmission?: {
      pages?: { url: string }[];
      finalPdfUrl?: string | null;
    } | null;
  } | null;
};

export type WrittenAttemptDetail = {
  attempt: { id: string };
  student?: { fullName?: string };
  exam?: { title?: string };
  questions?: WrittenAttemptQuestion[];
};

export type ResultsTabKey = 'analytics' | 'omr' | 'offline' | 'evaluation' | 'merit';

export type ExamResultsStats = ExamAnalytics | null;
