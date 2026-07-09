import { GripVertical, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TeachersPageHeaderProps = {
  sortMode: boolean;
  savingOrder: boolean;
  onAddTeacher: () => void;
  onToggleSortMode: () => void;
  onSaveOrder: () => void;
};

export function TeachersPageHeader({
  sortMode,
  savingOrder,
  onAddTeacher,
  onToggleSortMode,
  onSaveOrder,
}: TeachersPageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-linear-to-r from-violet-50 via-white to-indigo-50 p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Faculty Management
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Teachers</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage faculty profiles, branch assignments, and display order — all from one clean workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!sortMode ? (
              <Button
                onClick={onAddTeacher}
                className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={onToggleSortMode}
              className={cn(
                'rounded-xl border-slate-200 bg-white',
                sortMode && 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100',
              )}
            >
              <GripVertical className="mr-2 h-4 w-4" />
              {sortMode ? 'Cancel' : 'Sort Order'}
            </Button>
            {sortMode ? (
              <Button
                onClick={onSaveOrder}
                disabled={savingOrder}
                className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
              >
                {savingOrder ? 'Saving…' : 'Save Order'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
