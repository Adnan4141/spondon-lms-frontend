'use client';

import { ArrowRightLeft, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
  visibleCount: number;
  selectedCount: number;
  allVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onMoveSelected: () => void;
  onCopySelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
};

export function QuestionsBulkActionsBar({
  visibleCount,
  selectedCount,
  allVisibleSelected,
  onToggleSelectAll,
  onMoveSelected,
  onCopySelected,
  onDeleteSelected,
  onClearSelection,
}: Props) {
  return (
    <div className="border-b border-slate-100 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={onToggleSelectAll}
              aria-label="Select all visible questions"
            />
            <span className="font-semibold text-slate-700">Select all visible</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {visibleCount} visible
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 ? (
            <>
              <span className="rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-indigo-600 shadow-sm">
                {selectedCount} selected
              </span>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                onClick={onMoveSelected}
              >
                <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                Move Selected
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                onClick={onCopySelected}
              >
                <Copy className="mr-1.5 h-4 w-4" />
                Copy Selected
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={onDeleteSelected}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete Selected
              </Button>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
              >
                Clear selection
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
