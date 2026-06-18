'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPassages, getQuestionFolders, getQuestions } from '@/lib/api/question-bank';
import { queryKeys } from '@/lib/query/admin-query';
import type { Difficulty } from '@/types/question';
import type { ActiveTab } from '@/features/admin/questions/questions-page-utils';

export const QUESTIONS_PAGE_SIZE = 50;

export type QuestionsListFilters = {
  activeTab: ActiveTab;
  activeFolderId?: string;
  selectedFolderIds: string[];
  difficultyFilter: Difficulty | 'all';
  questionsPage: number;
  searchQuery: string;
};

function buildQuestionsListParams(filters: QuestionsListFilters) {
  const difficulty = filters.difficultyFilter === 'all' ? undefined : filters.difficultyFilter;
  const questionType =
    filters.activeTab === 'MCQ_SIMPLE' || filters.activeTab === 'MCQ_PASSAGE' ? 'MCQ' : filters.activeTab;
  const mcqType = filters.activeTab === 'MCQ_SIMPLE' ? 'SINGLE' : undefined;

  return {
    activeFolderId: filters.activeFolderId,
    selectedFolderIds: filters.selectedFolderIds,
    questionType,
    difficulty,
    mcqType,
    page: filters.questionsPage,
    limit: QUESTIONS_PAGE_SIZE,
    search: filters.searchQuery.trim() || undefined,
  };
}

export function useQuestionFolders() {
  return useQuery({
    queryKey: queryKeys.questions.folders,
    queryFn: async () => {
      const res = await getQuestionFolders();
      if (!res.success || !res.data) throw new Error('Failed to load folders');
      return res.data;
    },
  });
}

export function useQuestionsListQuery(filters: QuestionsListFilters, enabled: boolean) {
  const params = buildQuestionsListParams(filters);

  return useQuery({
    queryKey: queryKeys.questions.list(params),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await getQuestions(
        params.activeFolderId,
        params.questionType,
        params.difficulty,
        undefined,
        undefined,
        params.mcqType,
        undefined,
        params.selectedFolderIds.length > 0 ? params.selectedFolderIds : undefined,
        {
          page: params.page,
          limit: params.limit,
          search: params.search,
        },
      );
      if (!res.success || !res.data) throw new Error('Failed to load questions');
      return {
        questions: res.data,
        totalPages: res.pagination?.pages ?? 1,
      };
    },
  });
}

export function usePassagesListQuery(
  activeFolderId: string | undefined,
  selectedFolderIds: string[],
  enabled: boolean,
) {
  const params = { activeFolderId, selectedFolderIds };

  return useQuery({
    queryKey: queryKeys.questions.passages(params),
    enabled,
    queryFn: async () => {
      const res = await getPassages(
        activeFolderId,
        selectedFolderIds.length > 0 ? selectedFolderIds : undefined,
      );
      if (!res.success || !res.data) throw new Error('Failed to load passages');
      return res.data;
    },
  });
}

export function useQuestionsPageData(filters: QuestionsListFilters) {
  const queryClient = useQueryClient();
  const isPassageTab = filters.activeTab === 'MCQ_PASSAGE';

  const foldersQuery = useQuestionFolders();
  const questionsQuery = useQuestionsListQuery(filters, !isPassageTab);
  const passagesQuery = usePassagesListQuery(
    filters.activeFolderId,
    filters.selectedFolderIds,
    isPassageTab,
  );

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });

  const loading = isPassageTab
    ? passagesQuery.isLoading || passagesQuery.isFetching
    : questionsQuery.isLoading || questionsQuery.isFetching;

  return {
    folders: foldersQuery.data ?? [],
    questions: questionsQuery.data?.questions ?? [],
    questionsTotalPages: questionsQuery.data?.totalPages ?? 1,
    passages: passagesQuery.data ?? [],
    loading,
    invalidateAll,
    refetchFolders: () => foldersQuery.refetch(),
    refetchQuestions: () => questionsQuery.refetch(),
    refetchPassages: () => passagesQuery.refetch(),
  };
}
