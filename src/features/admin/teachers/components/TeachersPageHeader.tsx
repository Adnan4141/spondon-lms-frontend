import { GripVertical, Plus, Users } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/30">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/50" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-50/50" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-sm border border-indigo-100/50">
            <Users className="h-3.5 w-3.5" />
            Teacher Team
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">Teachers</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!sortMode ? (
            <Button
              className="h-14 px-8 rounded-2xl text-white bg-slate-900 font-black tracking-tight hover:bg-indigo-600 transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
              onClick={onAddTeacher}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Teacher
            </Button>
          ) : null}
          <Button
            variant="outline"
            className={cn(
              'h-14 px-6 rounded-2xl font-black tracking-tight border-2 transition-all',
              sortMode
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300',
            )}
            onClick={onToggleSortMode}
          >
            <GripVertical className="mr-2 h-5 w-5" />
            {sortMode ? 'Cancel' : 'Sort Order'}
          </Button>
          {sortMode ? (
            <Button
              className="h-14 px-8 rounded-2xl text-white bg-indigo-600 font-black tracking-tight hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
              onClick={onSaveOrder}
              disabled={savingOrder}
            >
              {savingOrder ? 'Saving…' : 'Save Order'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
