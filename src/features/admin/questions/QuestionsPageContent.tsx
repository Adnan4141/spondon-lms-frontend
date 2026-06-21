'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty } from '@/types/question';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { QuestionsBreadcrumbBar } from './components/QuestionsBreadcrumbBar';
import { QuestionsBulkActionsBar } from './components/QuestionsBulkActionsBar';
import { QuestionsErrorState } from './components/QuestionsErrorState';
import { QuestionsFolderErrorBanner } from './components/QuestionsFolderErrorBanner';
import { QuestionsFiltersBar } from './components/QuestionsFiltersBar';
import { QuestionsNestedFolderBrowser } from './components/QuestionsNestedFolderBrowser';
import { QuestionsSidebar } from './components/QuestionsSidebar';
import { QuestionsStatsGrid } from './components/QuestionsStatsGrid';
import { QuestionsSubfolderGrid } from './components/QuestionsSubfolderGrid';
import { QuestionsTable } from './components/QuestionsTable';
import { QuestionsTypeTabs } from './components/QuestionsTypeTabs';
import { PassagesTabPanel } from './components/PassagesTabPanel';
import { useQuestionBankStats } from './hooks/useQuestionBankStats';
import { useQuestionPageActions } from './hooks/useQuestionPageActions';
import { useQuestionsPageData } from './hooks/useQuestionsPageData';
import {
  getCurrentSubfolders,
  getDescendantFolderLevels,
  getFolderBreadcrumbs,
  getFolderById,
} from './questions-folder-utils';
import {
  ActiveTab,
  filterPassagesBySearch,
  filterQuestionsForTab,
  filterSubfoldersBySearch,
} from './questions-page-utils';
import { prefetchQuestionFormForTab } from './prefetchQuestionForms';

const SEARCH_DEBOUNCE_MS = 400;

export function QuestionsPageContent() {
  const { toasts, removeToast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('MCQ_SIMPLE');
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionsPage, setQuestionsPage] = useState(1);

  const debouncedSearchRef = useRef(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next !== debouncedSearchRef.current) {
        setDebouncedSearch(next);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listFilters = useMemo(
    () => ({
      activeTab,
      activeFolderId,
      selectedFolderIds,
      difficultyFilter,
      questionsPage,
      searchQuery: debouncedSearch,
    }),
    [activeTab, activeFolderId, selectedFolderIds, difficultyFilter, questionsPage, debouncedSearch],
  );

  const {
    folders,
    questions,
    questionsTotalPages,
    passages,
    isInitialLoading,
    isFetching,
    foldersError,
    contentError,
    invalidateAll,
    refetchFolders,
    refetchQuestions,
    refetchPassages,
    retryFolders,
    retryContent,
  } = useQuestionsPageData(listFilters);

  const stats = useQuestionBankStats();

  useEffect(() => {
    setQuestionsPage(1);
  }, [activeFolderId, selectedFolderIds, activeTab, difficultyFilter, debouncedSearch]);

  useEffect(() => {
    setSelectedQuestionIds((prev) => {
      const next = prev.filter((id) => questions.some((question) => question.id === id));
      return next.length === prev.length ? prev : next;
    });
  }, [questions]);

  useEffect(() => {
    if (activeTab === 'MCQ_PASSAGE') {
      setSelectedQuestionIds([]);
    }
  }, [activeTab]);

  useEffect(() => {
    prefetchQuestionFormForTab(activeTab);
  }, [activeTab]);

  const prefetchCreateQuestion = () => prefetchQuestionFormForTab(activeTab);

  const actions = useQuestionPageActions({
    folders,
    questions,
    activeTab,
    activeFolderId,
    setActiveFolderId,
    setSelectedFolderIds,
    setSelectedQuestionIds,
    invalidateAll,
    refetchFolders,
    refetchQuestions,
    refetchPassages,
  });

  const breadcrumbs = getFolderBreadcrumbs(folders, activeFolderId);
  const currentSubfolders = getCurrentSubfolders(folders, activeFolderId);
  const nestedLevels = getDescendantFolderLevels(folders, activeFolderId);
  const activeFolderName = getFolderById(folders, activeFolderId)?.name ?? 'All Folders';

  const filteredQuestions = useMemo(
    () => filterQuestionsForTab(questions, activeTab),
    [questions, activeTab],
  );
  const filteredPassages = useMemo(
    () => filterPassagesBySearch(passages, debouncedSearch),
    [passages, debouncedSearch],
  );
  const filteredSubfolders = useMemo(
    () => filterSubfoldersBySearch(currentSubfolders, searchInput),
    [currentSubfolders, searchInput],
  );

  const visibleQuestionIds = filteredQuestions.map((question) => question.id);
  const visibleSelectedQuestionIds = selectedQuestionIds.filter((id) => visibleQuestionIds.includes(id));
  const allVisibleQuestionsSelected =
    visibleQuestionIds.length > 0 && visibleSelectedQuestionIds.length === visibleQuestionIds.length;

  const toggleExpand = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePassageExpand = (id: string) => {
    setExpandedPassageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleQuestionSelection = (id: string, checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((questionId) => questionId !== id);
    });
  };

  const toggleSelectAllVisibleQuestions = (checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      if (checked) return [...new Set([...prev, ...visibleQuestionIds])];
      return prev.filter((id) => !visibleQuestionIds.includes(id));
    });
  };

  const createButtonLabel = () => {
    switch (activeTab) {
      case 'MCQ_SIMPLE':
        return 'New Simple MCQ';
      case 'MCQ_PASSAGE':
        return 'New Passage';
      case 'CQ':
        return 'New CQ';
      case 'SHORT':
        return 'New Short Q';
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <QuestionsStatsGrid
        totalQuestions={stats.totalQuestions}
        simpleMcq={stats.simpleMcq}
        passageCount={stats.passageCount}
        cqCount={stats.cqCount}
        shortCount={stats.shortCount}
        isLoading={stats.isLoading}
      />

      <QuestionsTypeTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTabPrefetch={prefetchQuestionFormForTab}
        variant="mobile"
      />

      <div className="flex min-h-[75vh] gap-6">
        <QuestionsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTabPrefetch={prefetchQuestionFormForTab}
          foldersError={foldersError}
          onRetryFolders={retryFolders}
          folders={folders}
          folderSearchQuery={folderSearchQuery}
          onFolderSearchChange={setFolderSearchQuery}
          activeFolderId={activeFolderId}
          onActiveFolderChange={setActiveFolderId}
          selectedFolderIds={selectedFolderIds}
          onSelectedFolderIdsChange={setSelectedFolderIds}
          onCreateFolder={actions.handleCreateFolder}
          onEditFolder={actions.handleEditFolder}
          onDeleteFolder={actions.handleDeleteFolder}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <QuestionsBreadcrumbBar
            breadcrumbs={breadcrumbs}
            activeFolderId={activeFolderId}
            onActiveFolderChange={setActiveFolderId}
            createButtonLabel={createButtonLabel()}
            onBulkImport={actions.handleBulkImport}
            bulkImportDisabled={!activeFolderId}
            onCreateFolder={() => actions.handleCreateFolder()}
            onCreateQuestion={actions.handleCreateQuestion}
            onPrefetchCreateQuestion={prefetchCreateQuestion}
          />

          {foldersError ? (
            <QuestionsFolderErrorBanner
              className="flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:hidden"
              message={foldersError.message}
              onRetry={retryFolders}
            />
          ) : null}

          <QuestionsFiltersBar
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            activeTab={activeTab}
            difficultyFilter={difficultyFilter}
            onDifficultyChange={setDifficultyFilter}
            loading={isFetching}
            onRefresh={actions.refreshCurrentTab}
            selectedFolderCount={selectedFolderIds.length}
            onClearFolderSelection={() => setSelectedFolderIds([])}
          />

          <div className="relative min-h-[400px] overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-sm">
            {contentError ? (
              <QuestionsErrorState message={contentError.message} onRetry={retryContent} />
            ) : isInitialLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Loading...</p>
              </div>
            ) : (
              <div className={cn(isFetching && 'pointer-events-none opacity-60 transition-opacity')}>
                <QuestionsSubfolderGrid
                  folders={folders}
                  subfolders={filteredSubfolders}
                  onSelectFolder={setActiveFolderId}
                />

                <QuestionsNestedFolderBrowser
                  nestedLevels={nestedLevels}
                  activeFolderName={activeFolderName}
                  activeFolderId={activeFolderId}
                  onSelectFolder={setActiveFolderId}
                  onBackToRoot={() => setActiveFolderId(undefined)}
                />

                {activeTab === 'MCQ_PASSAGE' ? (
                  <PassagesTabPanel
                    passages={filteredPassages}
                    expandedPassageIds={expandedPassageIds}
                    onToggleExpand={togglePassageExpand}
                    onEditPassage={actions.handleEditPassage}
                    onDeletePassage={actions.handleDeletePassage}
                    onEditQuestion={actions.handleEditQuestion}
                    onDeleteQuestion={actions.handleDeleteQuestion}
                  />
                ) : (
                  <>
                    <QuestionsBulkActionsBar
                      visibleCount={filteredQuestions.length}
                      selectedCount={selectedQuestionIds.length}
                      allVisibleSelected={allVisibleQuestionsSelected}
                      onToggleSelectAll={toggleSelectAllVisibleQuestions}
                      onMoveSelected={() => actions.openMoveQuestionsModal(selectedQuestionIds)}
                      onCopySelected={() => actions.openCopyQuestionsModal(selectedQuestionIds)}
                      onDeleteSelected={() => actions.openDeleteQuestionsModal(selectedQuestionIds)}
                      onClearSelection={() => setSelectedQuestionIds([])}
                    />
                    <QuestionsTable
                      questions={filteredQuestions}
                      hasSubfolders={filteredSubfolders.length > 0}
                      expandedQuestionIds={expandedQuestionIds}
                      selectedQuestionIds={selectedQuestionIds}
                      allVisibleQuestionsSelected={allVisibleQuestionsSelected}
                      questionsPage={questionsPage}
                      questionsTotalPages={questionsTotalPages}
                      loading={isFetching}
                      onToggleExpand={toggleExpand}
                      onToggleSelection={toggleQuestionSelection}
                      onToggleSelectAll={toggleSelectAllVisibleQuestions}
                      onMove={actions.openMoveQuestionsModal}
                      onCopy={actions.openCopyQuestionsModal}
                      onDelete={actions.openDeleteQuestionsModal}
                      onEdit={actions.handleEditQuestion}
                      onCreateQuestion={actions.handleCreateQuestion}
                      onPrefetchCreateQuestion={prefetchCreateQuestion}
                      onPageChange={setQuestionsPage}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
