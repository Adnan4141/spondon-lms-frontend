'use client';

import Image from 'next/image';
import {
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Pencil,
  Star,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { Course, Program } from '@/types/course';

export type CourseRowSharedProps = {
  programs: Program[];
  toggling: Record<string, boolean>;
  onToggleFeatured: (c: Course) => void;
  onToggleVisible: (c: Course) => void;
  onToggleAdmission: (c: Course) => void;
  onEdit: (c: Course) => void;
  onContent: (c: Course) => void;
};

function CourseTableCells({
  course,
  programs,
  toggling,
  onToggleFeatured,
  onToggleVisible,
  onToggleAdmission,
  onEdit,
  onContent,
  sortMode,
}: CourseRowSharedProps & { course: Course; sortMode: boolean }) {
  const fee = Number(course.fee);
  const offer = course.offerPrice ? Number(course.offerPrice) : null;
  const pct = offer && offer < fee ? Math.round((1 - offer / fee) * 100) : 0;
  const prog = programs.find((p) => p.id === course.programId);

  return (
    <>
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Image
              src={
                course.thumbnail ||
                `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%235C2D91'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='28' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E`
              }
              alt={course.name}
              height={36}
              width={36}
              className="h-full w-full rounded-lg object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">{course.name}</p>
            <p className="font-mono text-[11px] text-slate-400">{course.slug}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell">{prog?.name ?? '—'}</td>
      <td className="hidden px-4 py-3 text-center lg:table-cell">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold',
            course.type === 'ONLINE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
          )}
        >
          {course.type}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {offer && pct > 0 ? (
          <div>
            <span className="text-[10px] text-slate-400 line-through">৳{fee.toLocaleString()}</span>
            <span className="ml-1 text-sm font-bold text-slate-900">৳{offer.toLocaleString()}</span>
            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
              {pct}%
            </span>
          </div>
        ) : (
          <span className="text-sm font-bold text-slate-900">৳{fee.toLocaleString()}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            title={course.featured ? 'Featured (click to unfeature)' : 'Not featured (click to feature)'}
            onClick={() => onToggleFeatured(course)}
            disabled={!!toggling[course.id + '_f'] || sortMode}
            className={cn(
              'rounded-lg border p-1.5 transition-all disabled:opacity-40',
              sortMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              course.featured
                ? 'border-amber-300 bg-amber-50 text-amber-600'
                : 'border-slate-200 bg-white text-slate-300 hover:text-amber-400'
            )}
          >
            <Star className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={course.websiteVisible ? 'Visible (click to hide)' : 'Hidden (click to show)'}
            onClick={() => onToggleVisible(course)}
            disabled={!!toggling[course.id + '_v'] || sortMode}
            className={cn(
              'rounded-lg border p-1.5 transition-all disabled:opacity-40',
              sortMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              course.websiteVisible
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-slate-200 bg-white text-slate-300 hover:text-blue-400'
            )}
          >
            {course.websiteVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            title={
              course.admissionStatus === 'OPEN'
                ? 'Admission OPEN (click to close)'
                : 'Admission CLOSED (click to open)'
            }
            onClick={() => onToggleAdmission(course)}
            disabled={!!toggling[course.id + '_a'] || sortMode}
            className={cn(
              'rounded-lg border p-1.5 transition-all disabled:opacity-40',
              sortMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              course.admissionStatus === 'OPEN'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                : 'border-slate-300 bg-slate-100 text-slate-600'
            )}
          >
            {course.admissionStatus === 'OPEN' ? (
              <ToggleRight className="h-3.5 w-3.5" />
            ) : (
              <ToggleLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-center sm:table-cell">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold',
            course.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700'
              : course.status === 'DISABLED'
                ? 'bg-slate-100 text-slate-700'
                : 'bg-slate-100 text-slate-500'
          )}
        >
          {course.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={sortMode}
            onClick={() => onEdit(course)}
            className={cn(
              'flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors',
              sortMode ? 'pointer-events-none opacity-40' : 'hover:bg-slate-100'
            )}
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            type="button"
            disabled={sortMode}
            onClick={() => onContent(course)}
            className={cn(
              'flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition-colors',
              sortMode ? 'pointer-events-none opacity-40' : 'hover:bg-indigo-100'
            )}
          >
            <Layers className="h-3 w-3" /> Content
          </button>
        </div>
      </td>
    </>
  );
}

/** Standard row — no drag-and-drop (use when not in reorder mode). */
export function CourseTableRow(props: CourseRowSharedProps & { course: Course }) {
  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <CourseTableCells {...props} course={props.course} sortMode={false} />
    </tr>
  );
}

/** Must render inside `DndContext` + `SortableContext`. */
export function SortableCourseTableRow(props: CourseRowSharedProps & { course: Course }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.course.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50/70 transition-colors">
      <td className="w-11 border-r border-slate-100 px-2 py-3 align-middle">
        <button
          type="button"
          className="cursor-grab touch-none rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </td>
      <CourseTableCells {...props} course={props.course} sortMode />
    </tr>
  );
}
