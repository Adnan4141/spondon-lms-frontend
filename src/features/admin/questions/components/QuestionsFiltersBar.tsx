'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Difficulty } from '@/types/question';
import { cn } from '@/lib/utils';
import { difficultyOptions, type ActiveTab } from '../questions-page-utils';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: ActiveTab;
  difficultyFilter: Difficulty | 'all';
  onDifficultyChange: (value: Difficulty | 'all') => void;
  loading: boolean;
  onRefresh: () => void;
  selectedFolderCount: number;
  onClearFolderSelection: () => void;
};

export function QuestionsFiltersBar({
  searchQuery,
  onSearchChange,
  activeTab,
  difficultyFilter,
  onDifficultyChange,
  loading,
  onRefresh,
  selectedFolderCount,
  onClearFolderSelection,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search questions or folders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 rounded-xl border-none bg-slate-50 pl-9 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {activeTab !== 'MCQ_PASSAGE' && (
        <Select value={difficultyFilter} onValueChange={(v) => onDifficultyChange(v as Difficulty | 'all')}>
          <SelectTrigger className="h-9 w-[140px] rounded-xl border-none bg-slate-50 text-sm font-medium">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Levels</SelectItem>
            {difficultyOptions
              .filter((o) => o !== 'all')
              .map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}

      <Button
        variant="outline"
        className="h-9 w-9 shrink-0 rounded-xl border-none bg-slate-50 p-0 hover:bg-slate-100"
        onClick={onRefresh}
      >
        <RefreshCw className={cn('h-4 w-4 text-slate-600', loading && 'animate-spin')} />
      </Button>

      {selectedFolderCount > 0 && (
        <button
          type="button"
          onClick={onClearFolderSelection}
          className="text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800"
        >
          {selectedFolderCount} folder{selectedFolderCount > 1 ? 's' : ''} selected · clear
        </button>
      )}
    </div>
  );
}
