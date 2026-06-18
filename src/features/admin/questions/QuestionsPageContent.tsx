'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Difficulty } from '@/types/question';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { QuestionsBreadcrumbBar } from './components/QuestionsBreadcrumbBar';
import { QuestionsBulkActionsBar } from './components/QuestionsBulkActionsBar';
import { QuestionsFiltersBar } from './components/QuestionsFiltersBar';
import { QuestionsNestedFolderBrowser } from './components/QuestionsNestedFolderBrowser';
import { QuestionsSidebar } from './components/QuestionsSidebar';
import { QuestionsStatsGrid } from './components/QuestionsStatsGrid';
import { QuestionsSubfolderGrid } from './components/QuestionsSubfolderGrid';
import { QuestionsTable } from './components/QuestionsTable';
import { PassagesTabPanel } from './components/PassagesTabPanel';
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
  computeQuestionStats,
  filterPassagesBySearch,
  filterQuestionsForTab,
  filterSubfoldersBySearch,
} from './questions-page-utils';

export function QuestionsPageContent() {
  const { toasts, removeToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('MCQ_SIMPLE');
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionsPage, setQuestionsPage] = useState(1);

  const listFilters = useMemo(
    () => ({
      activeTab,
      activeFolderId,
      selectedFolderIds,
      difficultyFilter,
      questionsPage,
      searchQuery,
    }),
    [activeTab, activeFolderId, selectedFolderIds, difficultyFilter, questionsPage, searchQuery],
  );

  const {
    folders,
    questions,
    questionsTotalPages,
    passages,
    loading,
    invalidateAll,
    refetchFolders,
    refetchQuestions,
    refetchPassages,
  } = useQuestionsPageData(listFilters);

  useEffect(() => {
    setQuestionsPage(1);
  }, [activeFolderId, selectedFolderIds, activeTab, difficultyFilter, searchQuery]);

  useEffect(() => {
    setSelectedQuestionIds((prev) => prev.filter((id) => questions.some((question) => question.id === id)));
  }, [questions]);

  useEffect(() => {
    if (activeTab === 'MCQ_PASSAGE') {
      setSelectedQuestionIds([]);
    }
  }, [activeTab]);

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
  const activeFolderName = getFolderById(folders, activeFolderId)?.name ?? 'Root';

  const filteredQuestions = useMemo(
    () => filterQuestionsForTab(questions, activeTab, searchQuery),
    [questions, activeTab, searchQuery],
  );
  const filteredPassages = useMemo(
    () => filterPassagesBySearch(passages, searchQuery),
    [passages, searchQuery],
  );
  const filteredSubfolders = useMemo(
    () => filterSubfoldersBySearch(currentSubfolders, searchQuery),
    [currentSubfolders, searchQuery],
  );

  const visibleQuestionIds = filteredQuestions.map((question) => question.id);
  const visibleSelectedQuestionIds = selectedQuestionIds.filter((id) => visibleQuestionIds.includes(id));
  const allVisibleQuestionsSelected =
    visibleQuestionIds.length > 0 && visibleSelectedQuestionIds.length === visibleQuestionIds.length;

  const statsAll = useMemo(() => computeQuestionStats(questions), [questions]);

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
        totalQuestions={questions.length + passages.length}
        simpleMcq={statsAll.mcq}
        passageCount={passages.length}
        cqCount={statsAll.cq}
        shortCount={statsAll.short}
      />

      <div className="flex min-h-[75vh] gap-6">
        <QuestionsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
          />

          <QuestionsFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            difficultyFilter={difficultyFilter}
            onDifficultyChange={setDifficultyFilter}
            loading={loading}
            onRefresh={actions.refreshCurrentTab}
            selectedFolderCount={selectedFolderIds.length}
            onClearFolderSelection={() => setSelectedFolderIds([])}
          />

          <div className="min-h-[400px] overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Loading...</p>
              </div>
            ) : (
              <>
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
                      loading={loading}
                      onToggleExpand={toggleExpand}
                      onToggleSelection={toggleQuestionSelection}
                      onToggleSelectAll={toggleSelectAllVisibleQuestions}
                      onMove={actions.openMoveQuestionsModal}
                      onCopy={actions.openCopyQuestionsModal}
                      onDelete={actions.openDeleteQuestionsModal}
                      onEdit={actions.handleEditQuestion}
                      onCreateQuestion={actions.handleCreateQuestion}
                      onPageChange={setQuestionsPage}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
