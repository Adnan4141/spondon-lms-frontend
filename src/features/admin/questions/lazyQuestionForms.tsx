'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

function ModalFormLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

export const LazyFolderForm = dynamic(
  () => import('./forms/FolderForm').then((m) => ({ default: m.FolderForm })),
  { loading: ModalFormLoading },
);

export const LazyPassageForm = dynamic(
  () => import('./forms/PassageForm').then((m) => ({ default: m.PassageForm })),
  { loading: ModalFormLoading },
);

export const LazyQuestionForm = dynamic(
  () => import('./forms/QuestionForm').then((m) => ({ default: m.QuestionForm })),
  { loading: ModalFormLoading },
);

export const LazyCqForm = dynamic(
  () => import('./forms/CqForm').then((m) => ({ default: m.CqForm })),
  { loading: ModalFormLoading },
);

export const LazyShortQuestionForm = dynamic(
  () => import('./forms/ShortQuestionForm').then((m) => ({ default: m.ShortQuestionForm })),
  { loading: ModalFormLoading },
);

export const LazyQuestionFolderActionModal = dynamic(
  () =>
    import('./components/QuestionFolderActionModal').then((m) => ({
      default: m.QuestionFolderActionModal,
    })),
  { loading: ModalFormLoading },
);

export const LazyBulkQuestionImportModal = dynamic(
  () =>
    import('./components/BulkQuestionImportModal').then((m) => ({
      default: m.BulkQuestionImportModal,
    })),
  { loading: ModalFormLoading },
);
