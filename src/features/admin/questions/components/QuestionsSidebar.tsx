'use client';

import { FolderPlus, Home, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FolderTree } from '@/features/admin/questions';
import type { QuestionFolder } from '@/types/question';
import { cn } from '@/lib/utils';
import { TAB_CONFIG, type ActiveTab } from '../questions-page-utils';

type Props = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
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
      <div className="space-y-1 rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
        <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
          Question Type
        </p>
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={cn('truncate text-sm font-bold leading-tight', isActive && 'text-indigo-700')}>
                  {tab.label}
                </p>
                <p className="truncate text-[10px] text-slate-400">{tab.description}</p>
              </div>
            </button>
          );
        })}
      </div>

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
