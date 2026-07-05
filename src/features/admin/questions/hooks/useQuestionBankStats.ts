'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { getPassages, getQuestionFolderTree, getQuestions } from '@/lib/api/question-bank';
import type { FolderTreeNode } from '@/lib/api/question-bank';
import { queryKeys } from '@/lib/query/admin-query';
import type { QuestionsPageScope } from './useQuestionsPageData';

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

function flattenFolderTree(nodes: FolderTreeNode[]): FolderTreeNode[] {
  const result: FolderTreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) {
      result.push(...flattenFolderTree(node.children));
    }
  }
  return result;
}

function aggregateStatsFromTree(nodes: FolderTreeNode[]) {
  const flat = flattenFolderTree(nodes);
  const simpleMcq = flat.reduce((sum, node) => sum + (node.counts?.mcqSingle ?? 0), 0);
  const cqCount = flat.reduce((sum, node) => sum + (node.counts?.cq ?? 0), 0);
  const shortCount = flat.reduce((sum, node) => sum + (node.counts?.short ?? 0), 0);
  const passageCount = flat.reduce((sum, node) => sum + (node.passageCount ?? 0), 0);

  return {
    simpleMcq,
    cqCount,
    shortCount,
    passageCount,
    totalQuestions: simpleMcq + cqCount + shortCount + passageCount,
  };
}

function useTeacherQuestionBankStats(teacherUserId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.questions.folderTree(teacherUserId),
    enabled: Boolean(teacherUserId),
    queryFn: async () => {
      const res = await getQuestionFolderTree(undefined, teacherUserId);
      if (!res.success || !res.data) throw new Error('Failed to load question stats');
      return res.data;
    },
    staleTime: 60_000,
  });

  const stats = query.data ? aggregateStatsFromTree(query.data) : null;

  return {
    totalQuestions: stats?.totalQuestions ?? 0,
    simpleMcq: stats?.simpleMcq ?? 0,
    passageCount: stats?.passageCount ?? 0,
    cqCount: stats?.cqCount ?? 0,
    shortCount: stats?.shortCount ?? 0,
    isLoading: query.isLoading,
  };
}

export function useQuestionBankStats(scope?: QuestionsPageScope) {
  const teacherUserId = scope?.teacherUserId;
  const teacherStats = useTeacherQuestionBankStats(teacherUserId);

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.questions.statsCount({ type: 'MCQ', mcqType: 'SINGLE' }, teacherUserId),
        queryFn: () => fetchQuestionCount('MCQ', 'SINGLE'),
        staleTime: 60_000,
        enabled: !teacherUserId,
      },
      {
        queryKey: queryKeys.questions.statsCount({ type: 'CQ' }, teacherUserId),
        queryFn: () => fetchQuestionCount('CQ'),
        staleTime: 60_000,
        enabled: !teacherUserId,
      },
      {
        queryKey: queryKeys.questions.statsCount({ type: 'SHORT' }, teacherUserId),
        queryFn: () => fetchQuestionCount('SHORT'),
        staleTime: 60_000,
        enabled: !teacherUserId,
      },
      {
        queryKey: queryKeys.questions.passageCount(teacherUserId),
        queryFn: async () => {
          const res = await getPassages();
          if (!res.success || !res.data) return 0;
          return res.data.length;
        },
        staleTime: 60_000,
        enabled: !teacherUserId,
      },
    ],
  });

  if (teacherUserId) {
    return teacherStats;
  }

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
    isLoading: results.some((result) => result.isLoading),
  };
}
