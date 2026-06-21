'use client';

import { ChevronRight, FolderPlus, Home, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuestionFolder } from '@/types/question';
import { cn } from '@/lib/utils';

type Props = {
  breadcrumbs: QuestionFolder[];
  activeFolderId?: string;
  onActiveFolderChange: (id?: string) => void;
  createButtonLabel: string;
  onBulkImport: () => void;
  bulkImportDisabled: boolean;
  onCreateFolder: () => void;
  onCreateQuestion: () => void;
  onPrefetchCreateQuestion?: () => void;
};

export function QuestionsBreadcrumbBar({
  breadcrumbs,
  activeFolderId,
  onActiveFolderChange,
  createButtonLabel,
  onBulkImport,
  bulkImportDisabled,
  onCreateFolder,
  onCreateQuestion,
  onPrefetchCreateQuestion,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200/60 bg-white px-5 py-3 shadow-sm">
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => onActiveFolderChange(undefined)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold transition-colors',
            !activeFolderId ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700',
          )}
        >
          <Home className="h-3.5 w-3.5" />
          <span>All Folders</span>
        </button>

        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.id} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            <button
              type="button"
              onClick={() => onActiveFolderChange(crumb.id)}
              className={cn(
                'max-w-[160px] truncate rounded-lg px-2 py-1 text-sm font-bold transition-colors',
                idx === breadcrumbs.length - 1
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-400 hover:text-slate-700',
              )}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          onClick={onBulkImport}
          disabled={bulkImportDisabled}
          className="h-9 rounded-xl border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Bulk Import
        </Button>
        <Button
          variant="outline"
          onClick={onCreateFolder}
          className="h-9 rounded-xl border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FolderPlus className="mr-1.5 h-4 w-4" />
          New Folder
        </Button>
        <Button
          onClick={onCreateQuestion}
          onMouseEnter={onPrefetchCreateQuestion}
          onFocus={onPrefetchCreateQuestion}
          className="h-9 rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-600"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {createButtonLabel}
        </Button>
      </div>
    </div>
  );
}
