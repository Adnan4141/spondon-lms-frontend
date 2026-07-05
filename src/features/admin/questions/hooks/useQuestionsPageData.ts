'use client';

import { useCallback, useMemo } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPassages, getQuestionFolders, getQuestions } from '@/lib/api/question-bank';
import { queryKeys } from '@/lib/query/admin-query';
import type { Difficulty, McqPassage, Question, QuestionFolder } from '@/types/question';
import type { ActiveTab } from '@/features/admin/questions/questions-page-utils';

const EMPTY_FOLDERS: QuestionFolder[] = [];
const EMPTY_QUESTIONS: Question[] = [];
const EMPTY_PASSAGES: McqPassage[] = [];

function readPaginationPages(pagination?: { totalPages?: number; pages?: number }): number {
  if (!pagination) return 1;
  return pagination.totalPages ?? pagination.pages ?? 1;
}

function toQueryError(error: unknown): Error | null {
  if (!error) return null;
  if (error instanceof Error) return error;
  return new Error('Failed to load data');
}

export const QUESTIONS_PAGE_SIZE = 50;

export type QuestionsListFilters = {
  activeTab: ActiveTab;
  activeFolderId?: string;
  selectedFolderIds: string[];
  difficultyFilter: Difficulty | 'all';
  questionsPage: number;
  searchQuery: string;
};

export type QuestionsPageScope = {
  teacherUserId?: string;
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

function resolveTeacherRootFolderIds(
  teacherUserId: string | undefined,
  filters: QuestionsListFilters,
  folders: QuestionFolder[],
): string[] | undefined {
  if (!teacherUserId) return undefined;
  if (filters.activeFolderId || filters.selectedFolderIds.length > 0) return undefined;
  return folders.map((folder) => folder.id);
}

export function useQuestionFolders(scope?: QuestionsPageScope) {
  const teacherUserId = scope?.teacherUserId;

  return useQuery({
    queryKey: queryKeys.questions.folders(teacherUserId),
    enabled: !teacherUserId || Boolean(teacherUserId),
    queryFn: async () => {
      const res = await getQuestionFolders(undefined, undefined, teacherUserId);
      if (!res.success || !res.data) throw new Error('Failed to load folders');
      return res.data;
    },
  });
}

export function useQuestionsListQuery(
  filters: QuestionsListFilters,
  enabled: boolean,
  scope?: QuestionsPageScope,
  teacherRootFolderIds?: string[],
) {
  const teacherUserId = scope?.teacherUserId;
  const params = buildQuestionsListParams(filters);
  const scopedFolderIds =
    teacherRootFolderIds && teacherRootFolderIds.length > 0 ? teacherRootFolderIds : undefined;

  return useQuery({
    queryKey: queryKeys.questions.list({ ...params, scopedFolderIds }, teacherUserId),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const folderId = params.activeFolderId;
      const folderIds =
        params.selectedFolderIds.length > 0
          ? params.selectedFolderIds
          : scopedFolderIds;

      const res = await getQuestions(
        folderIds ? undefined : folderId,
        params.questionType,
        params.difficulty,
        undefined,
        undefined,
        params.mcqType,
        undefined,
        folderIds,
        {
          page: params.page,
          limit: params.limit,
          search: params.search,
        },
      );
      if (!res.success || !res.data) throw new Error('Failed to load questions');
      return {
        questions: res.data,
        totalPages: readPaginationPages(res.pagination),
      };
    },
  });
}

export function usePassagesListQuery(
  activeFolderId: string | undefined,
  selectedFolderIds: string[],
  enabled: boolean,
  scope?: QuestionsPageScope,
  teacherRootFolderIds?: string[],
) {
  const teacherUserId = scope?.teacherUserId;
  const params = { activeFolderId, selectedFolderIds, teacherRootFolderIds };
  const scopedFolderIds =
    teacherRootFolderIds && teacherRootFolderIds.length > 0 ? teacherRootFolderIds : undefined;

  return useQuery({
    queryKey: queryKeys.questions.passages(params, teacherUserId),
    enabled,
    queryFn: async () => {
      const folderIds =
        selectedFolderIds.length > 0 ? selectedFolderIds : scopedFolderIds;
      const res = await getPassages(
        folderIds ? undefined : activeFolderId,
        folderIds,
      );
      if (!res.success || !res.data) throw new Error('Failed to load passages');
      return res.data;
    },
  });
}

export function useQuestionsPageData(filters: QuestionsListFilters, scope?: QuestionsPageScope) {
  const queryClient = useQueryClient();
  const teacherUserId = scope?.teacherUserId;
  const isPassageTab = filters.activeTab === 'MCQ_PASSAGE';

  const foldersQuery = useQuestionFolders(scope);
  const folders = foldersQuery.data ?? EMPTY_FOLDERS;

  const teacherRootFolderIds = useMemo(
    () => resolveTeacherRootFolderIds(teacherUserId, filters, folders),
    [teacherUserId, filters, folders],
  );

  const teacherAtRoot =
    Boolean(teacherUserId) &&
    !filters.activeFolderId &&
    filters.selectedFolderIds.length === 0;

  const teacherRootReady = !teacherAtRoot || foldersQuery.isSuccess;
  const teacherHasFolders = !teacherAtRoot || (teacherRootFolderIds?.length ?? 0) > 0;

  const contentEnabled = teacherRootReady && (!teacherAtRoot || teacherHasFolders);

  const questionsQuery = useQuestionsListQuery(
    filters,
    !isPassageTab && contentEnabled,
    scope,
    teacherRootFolderIds,
  );
  const passagesQuery = usePassagesListQuery(
    filters.activeFolderId,
    filters.selectedFolderIds,
    isPassageTab && contentEnabled,
    scope,
    teacherRootFolderIds,
  );

  const invalidateAll = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all(teacherUserId) }),
    [queryClient, teacherUserId],
  );

  const activeQuery = isPassageTab ? passagesQuery : questionsQuery;
  const isInitialLoading =
    (activeQuery.isLoading && !activeQuery.data) ||
    (teacherUserId && foldersQuery.isLoading && !foldersQuery.data);
  const isFetching = activeQuery.isFetching || foldersQuery.isFetching;
  const foldersError = toQueryError(foldersQuery.error);
  const contentError = toQueryError(activeQuery.error);

  const retryFolders = () => {
    void foldersQuery.refetch();
  };

  const retryContent = () => {
    if (isPassageTab) void passagesQuery.refetch();
    else void questionsQuery.refetch();
  };

  return {
    folders,
    questions: questionsQuery.data?.questions ?? EMPTY_QUESTIONS,
    questionsTotalPages: questionsQuery.data?.totalPages ?? 1,
    passages: passagesQuery.data ?? EMPTY_PASSAGES,
    isInitialLoading,
    isFetching,
    foldersError,
    contentError,
    invalidateAll,
    refetchFolders: () => foldersQuery.refetch(),
    refetchQuestions: () => questionsQuery.refetch(),
    refetchPassages: () => passagesQuery.refetch(),
    retryFolders,
    retryContent,
  };
}
