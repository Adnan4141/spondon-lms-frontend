'use client';

import { FolderPlus, Home, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FolderTree } from '@/features/admin/questions';
import type { QuestionFolder } from '@/types/question';
import { cn } from '@/lib/utils';
import { QuestionsFolderErrorBanner } from './QuestionsFolderErrorBanner';
import { QuestionsTypeTabs } from './QuestionsTypeTabs';
import type { ActiveTab } from '../questions-page-utils';

type Props = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onTabPrefetch?: (tab: ActiveTab) => void;
  foldersError?: Error | null;
  onRetryFolders?: () => void;
  folders: QuestionFolder[];
  folderSearchQuery: string;
  onFolderSearchChange: (query: string) => void;
  activeFolderId?: string;
  onActiveFolderChange: (id?: string) => void;
  selectedFolderIds: string[];
  onSelectedFolderIdsChange: (ids: string[]) => void;
  onCreateFolder: (parentId?: string) => void;
  onEditFolder: (folder: QuestionFolder) => void;
  onDeleteFolder: (id: string) => void;
};

export function QuestionsSidebar({
  activeTab,
  onTabChange,
  onTabPrefetch,
  foldersError,
  onRetryFolders,
  folders,
  folderSearchQuery,
  onFolderSearchChange,
  activeFolderId,
  onActiveFolderChange,
  selectedFolderIds,
  onSelectedFolderIdsChange,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}: Props) {
  return (
    <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
      <QuestionsTypeTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTabPrefetch={onTabPrefetch}
        variant="sidebar"
      />

      <div className="rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-2 py-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Folders</p>
          <button
            type="button"
            onClick={() => onCreateFolder()}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            title="New Root Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-2 px-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={folderSearchQuery}
              onChange={(e) => onFolderSearchChange(e.target.value)}
              placeholder="Find nested folders..."
              className="h-8 rounded-xl border-none bg-slate-50 pl-8 pr-2 text-xs font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onActiveFolderChange(undefined)}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all',
            !activeFolderId
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          All Folders
        </button>

        {foldersError && onRetryFolders ? (
          <div className="mt-2 px-1">
            <QuestionsFolderErrorBanner message={foldersError.message} onRetry={onRetryFolders} />
          </div>
        ) : null}

        <div className="mt-1">
          <FolderTree
            folders={folders}
            selectedFolderIds={selectedFolderIds}
            onSelectFolders={onSelectedFolderIdsChange}
            onEditFolder={onEditFolder}
            onDeleteFolder={onDeleteFolder}
            onCreateSubfolder={(parentId) => onCreateFolder(parentId)}
            activeFolderId={activeFolderId}
            onActiveFolderChange={onActiveFolderChange}
            searchQuery={folderSearchQuery}
          />
        </div>
      </div>
    </aside>
  );
}
