'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Copy,
  FolderInput,
  FolderOpen,
  Info,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useModalStore } from '@/store/modalStore';
import { cn } from '@/lib/utils';
import type { QuestionFolder } from '@/types/question';

function buildFolderPathLabel(folder: QuestionFolder, folders: QuestionFolder[]) {
  const byId = new Map(folders.map((item) => [item.id, item]));
  const segments: string[] = [];
  let current: QuestionFolder | undefined = folder;
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    segments.unshift(current.name);
    current = current.parentFolderId ? byId.get(current.parentFolderId) : undefined;
  }

  return segments.join(' / ');
}

export type QuestionFolderActionContext = {
  sourceFolderIds?: string[];
  questionPreviews?: string[];
};

type Props = {
  folders: QuestionFolder[];
  itemCount: number;
  action: 'move' | 'copy';
  onSubmit: (targetFolderId: string) => Promise<void>;
  context?: QuestionFolderActionContext;
};

export function QuestionFolderActionModal({
  folders,
  itemCount,
  action,
  onSubmit,
  context,
}: Props) {
  const { closeModal } = useModalStore();
  const [targetFolderId, setTargetFolderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sourceFolderIds = context?.sourceFolderIds ?? [];
  const questionPreviews = context?.questionPreviews ?? [];

  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);

  const sourceLabels = useMemo(
    () =>
      sourceFolderIds
        .map((id) => {
          const folder = folderById.get(id);
          return folder ? buildFolderPathLabel(folder, folders) : null;
        })
        .filter((label): label is string => Boolean(label)),
    [folders, folderById, sourceFolderIds],
  );

  const folderOptions = useMemo(() => {
    const excludeIds = action === 'move' ? new Set(sourceFolderIds) : new Set<string>();

    return folders
      .filter((folder) => !excludeIds.has(folder.id))
      .map((folder) => {
        const path = buildFolderPathLabel(folder, folders);
        const count = folder._count?.questions;
        return {
          value: folder.id,
          label: count != null ? `${path} (${count} questions)` : path,
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [action, folders, sourceFolderIds]);

  const selectedFolder = targetFolderId ? folderById.get(targetFolderId) : undefined;
  const selectedPath = selectedFolder ? buildFolderPathLabel(selectedFolder, folders) : '';
  const copiesToSameFolder =
    action === 'copy' && targetFolderId && sourceFolderIds.length === 1 && sourceFolderIds[0] === targetFolderId;
  const copiesAcrossSameSources =
    action === 'copy' && targetFolderId && sourceFolderIds.length > 1 && sourceFolderIds.includes(targetFolderId);

  const actionLabel = action === 'move' ? 'Move' : 'Copy';
  const actionVerb = action === 'move' ? 'moved' : 'copied';
  const submittingLabel = action === 'move' ? 'Moving…' : 'Copying…';
  const ActionIcon = action === 'move' ? ArrowRightLeft : Copy;
  const accent = action === 'move'
    ? {
        ring: 'ring-amber-100',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        button: 'bg-amber-600 hover:bg-amber-700',
        preview: 'border-amber-200 bg-amber-50/80 text-amber-900',
      }
    : {
        ring: 'ring-indigo-100',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        button: 'bg-indigo-600 hover:bg-indigo-700',
        preview: 'border-indigo-200 bg-indigo-50/80 text-indigo-900',
      };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!targetFolderId || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(targetFolderId);
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col bg-white text-slate-900">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
      <div className={cn('rounded-2xl border border-slate-200 p-4 ring-1', accent.ring, accent.bg)}>
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm', accent.text)}>
            <ActionIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {actionLabel} Selection
              </p>
              <Badge className={cn('rounded-full border px-2 py-0.5 text-[10px] font-black uppercase', accent.badge)}>
                {itemCount} question{itemCount > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {itemCount} question{itemCount > 1 ? 's' : ''} will be {actionVerb} to the folder you choose below.
            </p>
            {sourceLabels.length > 0 ? (
              <p className="mt-2 text-xs font-medium text-slate-600">
                <span className="font-bold text-slate-500">From:</span>{' '}
                {sourceLabels.length === 1 ? sourceLabels[0] : `${sourceLabels.length} folders`}
              </p>
            ) : null}
          </div>
        </div>

        {questionPreviews.length > 0 ? (
          <ul className="mt-4 space-y-1.5 border-t border-white/70 pt-3">
            {questionPreviews.map((preview, index) => (
              <li key={`${preview}-${index}`} className="flex gap-2 text-xs text-slate-600">
                <span className="font-bold text-slate-400">•</span>
                <span className="line-clamp-1 font-medium">{preview}</span>
              </li>
            ))}
            {itemCount > questionPreviews.length ? (
              <li className="pl-3.5 text-[11px] font-semibold text-slate-400">
                + {itemCount - questionPreviews.length} more
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <FolderInput className="h-3.5 w-3.5" />
          Destination Folder
        </label>
        {folderOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <FolderOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {action === 'move' ? 'No other folders available to move into.' : 'No folders available.'}
            </p>
          </div>
        ) : (
          <SearchableSelect
            value={targetFolderId}
            onValueChange={setTargetFolderId}
            options={folderOptions}
            placeholder="Search and choose a destination folder"
            searchPlaceholder="Search folders…"
            emptyMessage="No matching folders."
            triggerClassName="h-11 rounded-2xl border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm"
          />
        )}
      </div>

      {selectedFolder ? (
        <div className={cn('rounded-2xl border px-4 py-3 text-sm', accent.preview)}>
          <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Ready to {action}</p>
          <p className="mt-1 font-bold">{selectedPath}</p>
          {selectedFolder._count?.questions != null ? (
            <p className="mt-1 text-xs font-medium opacity-80">
              Folder currently has {selectedFolder._count.questions} question
              {selectedFolder._count.questions === 1 ? '' : 's'}.
            </p>
          ) : null}
        </div>
      ) : null}

      {(copiesToSameFolder || copiesAcrossSameSources) ? (
        <div className="flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p className="font-medium">
            Copies will be added inside the same folder. Original questions stay unchanged.
          </p>
        </div>
      ) : null}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-6">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={closeModal}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={cn('rounded-xl text-white', accent.button)}
            disabled={!targetFolderId || submitting || folderOptions.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              <>
                <ActionIcon className="mr-2 h-4 w-4" />
                {actionLabel} {itemCount} Question{itemCount > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
