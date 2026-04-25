'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookOpen, GripVertical } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Book } from '@/lib/api/books';

export function SortableBookRow({ book }: { book: Book }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <TableRow ref={setNodeRef} style={style} className="bg-white hover:bg-indigo-50/30 transition-colors">
      <TableCell className="py-4 px-4 w-12">
        <button
          className="cursor-grab active:cursor-grabbing p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </TableCell>
      <TableCell className="py-4 px-4" colSpan={5}>
        <div className="flex items-center gap-4">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-base font-black text-slate-900">{book.name}</p>
            <p className="text-xs text-slate-500 font-semibold">{book.sku}</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
