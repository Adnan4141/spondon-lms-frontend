import { GripVertical } from 'lucide-react';

export function TeachersSortBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 ring-1 ring-violet-100">
        <GripVertical className="h-4 w-4" />
      </div>
      <p className="text-sm text-violet-800">
        <span className="font-bold">Sort mode:</span> drag rows to reorder teachers, then click{' '}
        <span className="font-black">Save Order</span>.
      </p>
    </div>
  );
}
