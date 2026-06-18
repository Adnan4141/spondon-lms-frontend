'use client';

import { Folder, FolderOpen } from 'lucide-react';
import type { QuestionFolder } from '@/types/question';

type Props = {
  folders: QuestionFolder[];
  subfolders: QuestionFolder[];
  onSelectFolder: (folderId: string) => void;
};

export function QuestionsSubfolderGrid({ folders, subfolders, onSelectFolder }: Props) {
  if (subfolders.length === 0) return null;

  return (
    <div className="px-6 pb-2 pt-6">
      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
        Folders ({subfolders.length})
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {subfolders.map((folder) => {
          const hasChildren = folders.some((f) => f.parentFolderId === folder.id);
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left transition-all hover:border-indigo-100 hover:bg-indigo-50"
            >
              {hasChildren ? (
                <FolderOpen className="h-7 w-7 text-amber-400 transition-colors group-hover:text-indigo-500" />
              ) : (
                <Folder className="h-7 w-7 text-amber-400 transition-colors group-hover:text-indigo-500" />
              )}
              <div className="min-w-0 w-full">
                <p className="truncate text-sm font-bold text-slate-700 transition-colors group-hover:text-indigo-700">
                  {folder.name}
                </p>
                {folder._count ? (
                  <p className="mt-0.5 text-[10px] text-slate-400">{folder._count.questions} questions</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-5 border-b border-slate-100" />
    </div>
  );
}
