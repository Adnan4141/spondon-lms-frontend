'use client';

import { useQueries } from '@tanstack/react-query';
import { getPassages, getQuestions } from '@/lib/api/question-bank';
import { queryKeys } from '@/lib/query/admin-query';

function readPaginationTotal(pagination?: {
  totalCount?: number;
  total?: number;
}): number {
  if (!pagination) return 0;
  return pagination.totalCount ?? pagination.total ?? 0;
}

async function fetchQuestionCount(type: string, mcqType?: string): Promise<number> {
  const res = await getQuestions(
    undefined,
    type,
    undefined,
    undefined,
    undefined,
    mcqType,
    undefined,
    undefined,
    { page: 1, limit: 1 },
  );
  if (!res.success) return 0;
  return readPaginationTotal(res.pagination);
}

export function useQuestionBankStats() {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.questions.statsCount({ type: 'MCQ', mcqType: 'SINGLE' }),
        queryFn: () => fetchQuestionCount('MCQ', 'SINGLE'),
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.questions.statsCount({ type: 'CQ' }),
        queryFn: () => fetchQuestionCount('CQ'),
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.questions.statsCount({ type: 'SHORT' }),
        queryFn: () => fetchQuestionCount('SHORT'),
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.questions.passageCount,
        queryFn: async () => {
          const res = await getPassages();
          if (!res.success || !res.data) return 0;
          return res.data.length;
        },
        staleTime: 60_000,
      },
    ],
  });

  const simpleMcq = results[0].data ?? 0;
  const cqCount = results[1].data ?? 0;
  const shortCount = results[2].data ?? 0;
  const passageCount = results[3].data ?? 0;

  return {
    totalQuestions: simpleMcq + cqCount + shortCount + passageCount,
    simpleMcq,
    passageCount,
    cqCount,
    shortCount,
    isLoading: results.some((r) => r.isLoading),
  };
}
