'use client';

import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import {
  bulkCopyQuestions,
  bulkDeleteQuestions,
  bulkMoveQuestions,
  copyQuestion,
  deletePassage,
  deleteQuestion,
  deleteQuestionFolder,
  getQuestionById,
  moveQuestion,
} from '@/lib/api/question-bank';
import type { McqPassage, Question, QuestionFolder } from '@/types/question';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { BULK_QUESTION_IMPORT_COMPLETE_EVENT } from '@/features/admin/students';
import {
  LazyBulkQuestionImportModal,
  LazyCqForm,
  LazyFolderForm,
  LazyPassageForm,
  LazyQuestionFolderActionModal,
  LazyQuestionForm,
  LazyShortQuestionForm,
} from '@/features/admin/questions/lazyQuestionForms';
import { getFolderById } from '../questions-folder-utils';
import { ActiveTab, buildQuestionFolderActionContext } from '../questions-page-utils';

type InvalidateFns = {
  invalidateAll: () => Promise<unknown>;
  refetchFolders: () => Promise<unknown>;
  refetchQuestions: () => Promise<unknown>;
  refetchPassages: () => Promise<unknown>;
};

type Params = InvalidateFns & {
  folders: QuestionFolder[];
  questions: Question[];
  activeTab: ActiveTab;
  activeFolderId?: string;
  setActiveFolderId: (id: string | undefined) => void;
  setSelectedFolderIds: Dispatch<SetStateAction<string[]>>;
  setSelectedQuestionIds: Dispatch<SetStateAction<string[]>>;
};

export function useQuestionPageActions({
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
}: Params) {
  const { openModal } = useModalStore();
  const { toast } = useToast();

  const refreshFolders = useCallback(async () => {
    await invalidateAll();
    await refetchFolders();
  }, [invalidateAll, refetchFolders]);

  const refreshQuestions = useCallback(async () => {
    await invalidateAll();
    await refetchQuestions();
  }, [invalidateAll, refetchQuestions]);

  const refreshPassages = useCallback(async () => {
    await invalidateAll();
    await refetchPassages();
  }, [invalidateAll, refetchPassages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleQuestionImportComplete = () => {
      void invalidateAll();
    };

    window.addEventListener(BULK_QUESTION_IMPORT_COMPLETE_EVENT, handleQuestionImportComplete);
    return () => {
      window.removeEventListener(BULK_QUESTION_IMPORT_COMPLETE_EVENT, handleQuestionImportComplete);
    };
  }, [invalidateAll]);

  const handleCreateFolder = useCallback(
    (parentId?: string) => {
      openModal({
        title: parentId ? 'New Subfolder' : 'New Folder',
        description: 'Create a new folder to organise your questions.',
        className: 'sm:max-w-2xl',
        content: (
          <LazyFolderForm
            folders={folders}
            initialParentId={parentId ?? activeFolderId}
            onSuccess={refreshFolders}
          />
        ),
      });
    },
    [activeFolderId, folders, openModal, refreshFolders],
  );

  const handleEditFolder = useCallback(
    (folder: QuestionFolder) => {
      openModal({
        title: 'Edit Folder',
        description: 'Update folder name or move it to a different parent.',
        className: 'sm:max-w-2xl',
        content: <LazyFolderForm folders={folders} folder={folder} onSuccess={refreshFolders} />,
      });
    },
    [folders, openModal, refreshFolders],
  );

  const handleDeleteFolder = useCallback(
    (id: string) => {
      openModal({
        title: 'Delete Folder',
        description: 'This will permanently remove the folder and all its contents.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Are you sure you want to delete this folder? All nested questions will be affected."
            onConfirm={async () => {
              await deleteQuestionFolder(id);
              await refreshFolders();
              if (activeFolderId === id) setActiveFolderId(undefined);
              setSelectedFolderIds((prev) => prev.filter((fid) => fid !== id));
            }}
          />
        ),
      });
    },
    [activeFolderId, openModal, refreshFolders, setActiveFolderId, setSelectedFolderIds],
  );

  const handleCreateQuestion = useCallback(() => {
    const fid = activeFolderId;
    switch (activeTab) {
      case 'MCQ_SIMPLE':
        openModal({
          title: 'New Simple MCQ',
          description: 'One question with 4 options and one correct answer.',
          className: 'sm:max-w-6xl',
          content: (
            <LazyQuestionForm
              folders={folders}
              initialFolderId={fid}
              initialType="MCQ"
              initialMcqType="SINGLE"
              onSuccess={refreshQuestions}
            />
          ),
        });
        break;
      case 'MCQ_PASSAGE':
        openModal({
          title: 'New Passage (Combined MCQ)',
          description: 'Create a stimulus passage for 2–5 MCQ questions.',
          className: 'sm:max-w-4xl',
          content: <LazyPassageForm folders={folders} onSuccess={refreshPassages} />,
        });
        break;
      case 'CQ':
        openModal({
          title: 'New Creative Question',
          description: 'Create a CQ with ক, খ, গ, ঘ sub-parts (10 marks).',
          className: 'sm:max-w-6xl',
          content: <LazyCqForm folders={folders} initialFolderId={fid} onSuccess={refreshQuestions} />,
        });
        break;
      case 'SHORT':
        openModal({
          title: 'New Short Question',
          description: 'Direct recall or definition — 1 to 3 line answer.',
          className: 'sm:max-w-4xl',
          content: (
            <LazyShortQuestionForm folders={folders} initialFolderId={fid} onSuccess={refreshQuestions} />
          ),
        });
        break;
    }
  }, [activeFolderId, activeTab, folders, openModal, refreshPassages, refreshQuestions]);

  const handleBulkImport = useCallback(() => {
    const folder = getFolderById(folders, activeFolderId);
    if (!folder) {
      toast({
        title: 'Select a folder',
        description: 'Bulk import uses one selected target folder.',
        variant: 'destructive',
      });
      return;
    }

    openModal({
      title: 'Bulk Import Questions',
      description: `Import questions into ${folder.name}.`,
      className: 'sm:max-w-6xl',
      content: <LazyBulkQuestionImportModal folder={folder} />,
    });
  }, [activeFolderId, folders, openModal, toast]);

  const handleEditQuestion = useCallback(
    async (id: string) => {
      const res = await getQuestionById(id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Could not load question.', variant: 'destructive' });
        return;
      }
      const q = res.data;
      if (q.type === 'CQ') {
        openModal({
          title: 'Edit Creative Question',
          description: 'Update the CQ stimulus and sub-parts.',
          className: 'sm:max-w-6xl',
          content: <LazyCqForm folders={folders} question={q} onSuccess={refreshQuestions} />,
        });
      } else if (q.type === 'SHORT') {
        openModal({
          title: 'Edit Short Question',
          description: 'Update the short question.',
          className: 'sm:max-w-4xl',
          content: <LazyShortQuestionForm folders={folders} question={q} onSuccess={refreshQuestions} />,
        });
      } else {
        openModal({
          title: 'Edit MCQ',
          description: 'Update the MCQ prompt and options.',
          className: 'sm:max-w-6xl',
          content: <LazyQuestionForm folders={folders} question={q} onSuccess={refreshQuestions} />,
        });
      }
    },
    [folders, openModal, refreshQuestions, toast],
  );

  const handleDeleteQuestion = useCallback(
    (id: string) => {
      openModal({
        title: 'Delete Question',
        description: 'This will permanently remove the question.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Are you sure you want to delete this question? This cannot be undone."
            onConfirm={async () => {
              await deleteQuestion(id);
              await refreshQuestions();
              setSelectedQuestionIds((prev) => prev.filter((questionId) => questionId !== id));
            }}
            confirmLabel="Delete Question"
            cancelLabel="Keep Question"
          />
        ),
      });
    },
    [openModal, refreshQuestions, setSelectedQuestionIds],
  );

  const openDeleteQuestionsModal = useCallback(
    (questionIds: string[]) => {
      openModal({
        title: questionIds.length === 1 ? 'Delete Question' : 'Delete Questions',
        description:
          questionIds.length === 1
            ? 'This will permanently remove the selected question.'
            : `This will permanently remove ${questionIds.length} selected questions.`,
        content: (
          <ConfirmationModal
            title={questionIds.length === 1 ? 'Confirm Delete' : 'Confirm Bulk Delete'}
            description={
              questionIds.length === 1
                ? 'Are you sure you want to delete this question? This cannot be undone.'
                : `Are you sure you want to delete ${questionIds.length} selected questions? This cannot be undone.`
            }
            confirmLabel={questionIds.length === 1 ? 'Delete Question' : `Delete ${questionIds.length} Questions`}
            cancelLabel="Keep Questions"
            onConfirm={async () => {
              if (questionIds.length === 1) {
                await deleteQuestion(questionIds[0]);
              } else {
                await bulkDeleteQuestions({ questionIds });
              }

              await refreshQuestions();
              setSelectedQuestionIds((prev) => prev.filter((id) => !questionIds.includes(id)));
              toast({
                title: 'Success',
                description:
                  questionIds.length === 1
                    ? 'Question deleted successfully.'
                    : `${questionIds.length} questions deleted successfully.`,
                variant: 'success',
              });
            }}
          />
        ),
      });
    },
    [openModal, refreshQuestions, setSelectedQuestionIds, toast],
  );

  const openMoveQuestionsModal = useCallback(
    (questionIds: string[]) => {
      openModal({
        title: questionIds.length === 1 ? 'Move Question' : 'Move Questions',
        description:
          questionIds.length === 1
            ? 'Relocate this question to a different folder. It will be removed from the current location.'
            : `Relocate ${questionIds.length} selected questions to a different folder.`,
        className: 'sm:max-w-xl',
        content: (
          <LazyQuestionFolderActionModal
            folders={folders}
            itemCount={questionIds.length}
            action="move"
            context={buildQuestionFolderActionContext(questionIds, questions, activeFolderId)}
            onSubmit={async (targetFolderId) => {
              try {
                if (questionIds.length === 1) {
                  await moveQuestion({ questionId: questionIds[0], targetFolderId });
                } else {
                  await bulkMoveQuestions({ questionIds, targetFolderId });
                }

                await invalidateAll();
                setSelectedQuestionIds((prev) => prev.filter((id) => !questionIds.includes(id)));
                toast({
                  title: 'Success',
                  description:
                    questionIds.length === 1
                      ? 'Question moved successfully.'
                      : `${questionIds.length} questions moved successfully.`,
                  variant: 'success',
                });
              } catch (error: unknown) {
                toast({
                  title: 'Move failed',
                  description: error instanceof Error ? error.message : 'Could not move the selected questions.',
                  variant: 'destructive',
                });
                throw error;
              }
            }}
          />
        ),
      });
    },
    [activeFolderId, folders, invalidateAll, openModal, questions, setSelectedQuestionIds, toast],
  );

  const openCopyQuestionsModal = useCallback(
    (questionIds: string[]) => {
      openModal({
        title: questionIds.length === 1 ? 'Copy Question' : 'Copy Questions',
        description:
          questionIds.length === 1
            ? 'Create a duplicate in another folder. The original question stays in place.'
            : `Create duplicates of ${questionIds.length} selected questions in another folder.`,
        className: 'sm:max-w-xl',
        content: (
          <LazyQuestionFolderActionModal
            folders={folders}
            itemCount={questionIds.length}
            action="copy"
            context={buildQuestionFolderActionContext(questionIds, questions, activeFolderId)}
            onSubmit={async (targetFolderId) => {
              try {
                if (questionIds.length === 1) {
                  await copyQuestion({ questionId: questionIds[0], targetFolderId });
                } else {
                  await bulkCopyQuestions({ questionIds, targetFolderId });
                }

                await invalidateAll();
                setSelectedQuestionIds((prev) => prev.filter((id) => !questionIds.includes(id)));
                toast({
                  title: 'Success',
                  description:
                    questionIds.length === 1
                      ? 'Question copied successfully.'
                      : `${questionIds.length} questions copied successfully.`,
                  variant: 'success',
                });
              } catch (error: unknown) {
                toast({
                  title: 'Copy failed',
                  description: error instanceof Error ? error.message : 'Could not copy the selected questions.',
                  variant: 'destructive',
                });
                throw error;
              }
            }}
          />
        ),
      });
    },
    [activeFolderId, folders, invalidateAll, openModal, questions, setSelectedQuestionIds, toast],
  );

  const handleDeletePassage = useCallback(
    (id: string) => {
      openModal({
        title: 'Delete Passage',
        description: 'This will remove the passage and all its linked questions.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Are you sure? All child MCQ questions linked to this passage will also be deleted."
            onConfirm={async () => {
              await deletePassage(id);
              await refreshPassages();
            }}
          />
        ),
      });
    },
    [openModal, refreshPassages],
  );

  const handleEditPassage = useCallback(
    (passage: McqPassage) => {
      openModal({
        title: 'Edit Combined MCQ Passage',
        description: 'Update the full passage, shared metadata, and linked MCQ questions in one place.',
        className: 'sm:max-w-4xl',
        content: <LazyPassageForm folders={folders} passage={passage} onSuccess={refreshPassages} />,
      });
    },
    [folders, openModal, refreshPassages],
  );

  const refreshAll = useCallback(() => {
    void invalidateAll();
  }, [invalidateAll]);

  const refreshCurrentTab = useCallback(() => {
    void invalidateAll();
    if (activeTab === 'MCQ_PASSAGE') void refetchPassages();
    else void refetchQuestions();
  }, [activeTab, invalidateAll, refetchPassages, refetchQuestions]);

  return {
    handleCreateFolder,
    handleEditFolder,
    handleDeleteFolder,
    handleCreateQuestion,
    handleBulkImport,
    handleEditQuestion,
    handleDeleteQuestion,
    openDeleteQuestionsModal,
    openMoveQuestionsModal,
    openCopyQuestionsModal,
    handleDeletePassage,
    handleEditPassage,
    refreshAll,
    refreshCurrentTab,
  };
}
