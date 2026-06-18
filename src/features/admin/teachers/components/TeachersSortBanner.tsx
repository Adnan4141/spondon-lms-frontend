import { GripVertical } from 'lucide-react';

export function TeachersSortBanner() {
  return (
    <div className="rounded-[24px] border border-indigo-200 bg-indigo-50 px-6 py-4 flex items-center gap-3">
      <GripVertical className="h-5 w-5 text-indigo-500 shrink-0" />
      <p className="text-sm font-bold text-indigo-700">
        Drag rows to reorder teachers. Click <span className="font-black">Save Order</span> when done.
      </p>
    </div>
  );
}
