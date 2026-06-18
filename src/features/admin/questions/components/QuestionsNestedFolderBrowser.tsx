'use client';

import { Folder } from 'lucide-react';
import type { QuestionFolder } from '@/types/question';

type Props = {
  nestedLevels: QuestionFolder[][];
  activeFolderName: string;
  activeFolderId?: string;
  onSelectFolder: (folderId: string) => void;
  onBackToRoot: () => void;
};

export function QuestionsNestedFolderBrowser({
  nestedLevels,
  activeFolderName,
  activeFolderId,
  onSelectFolder,
  onBackToRoot,
}: Props) {
  if (nestedLevels.length === 0) return null;

  return (
    <div className="px-6 pb-2">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Nested Browser · {activeFolderName}
          </p>
          {activeFolderId ? (
            <button
              type="button"
              onClick={onBackToRoot}
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 transition-colors hover:text-indigo-800"
            >
              Back to root
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
          {nestedLevels.slice(1).map((levelFolders, depthIdx) => (
            <div key={depthIdx}>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Level {depthIdx + 1}
              </p>
              <div className="flex flex-wrap gap-2">
                {levelFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {nestedLevels.length <= 1 ? (
            <p className="text-xs text-slate-400">No deeper nested folders under this node.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
