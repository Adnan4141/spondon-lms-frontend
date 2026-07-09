'use client';

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { User } from '@/lib/api/users';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { StudentAdminBadge } from '@/features/admin/students/components/StudentAdminBadge';
import { avatarHue } from '@/features/admin/students/utils';
import { Button } from '@/components/ui/button';
import {
  Ban,
  Building2,
  Eye,
  GraduationCap,
  GripVertical,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '../teachers-page-utils';

function TeacherAvatar({ teacher, size = 'md' }: { teacher: User; size?: 'sm' | 'md' }) {
  const hue = avatarHue(teacher.fullName);
  const initials = teacher.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';

  if (teacher.profileImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)}
        alt={teacher.fullName}
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-white', dim)}
      />
    );
  }

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full font-black', dim)}
      style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}
    >
      {initials}
    </div>
  );
}

function SortableTeacherRow({ teacher }: { teacher: User }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: teacher.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-slate-100 bg-violet-50/30 transition-colors hover:bg-violet-50/50"
    >
      <td className="w-12 px-4 py-3.5">
        <button
          type="button"
          className="cursor-grab touch-none rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-violet-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-3.5" colSpan={5}>
        <div className="flex items-center gap-3">
          <TeacherAvatar teacher={teacher} />
          <div>
            <p className="font-bold text-slate-900">{teacher.fullName}</p>
            {teacher.designation ? (
              <p className="text-[11px] text-slate-500">{teacher.designation}</p>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

type TeacherRowActions = {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSetStatus: (id: string, status: 'ACTIVE' | 'BLOCKED', label: string) => void;
  onDelete: (id: string, name: string) => void;
};

function TeacherTableRow({
  teacher,
  actions,
}: {
  teacher: User;
  actions: TeacherRowActions;
}) {
  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
      <td className="px-4 py-3.5">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={() => actions.onView(teacher.id)}
        >
          <TeacherAvatar teacher={teacher} />
          <div>
            <p className="font-bold text-slate-900 hover:text-violet-700">{teacher.fullName}</p>
            {teacher.createdAt ? (
              <p className="text-[11px] text-slate-400">Joined {timeAgo(teacher.createdAt)}</p>
            ) : null}
          </div>
        </button>
      </td>
      <td className="px-4 py-3.5">
        <div className="space-y-1">
          {teacher.designation ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              {teacher.designation}
            </div>
          ) : null}
          {teacher.institute ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="h-3 w-3 shrink-0 text-slate-300" />
              {teacher.institute}
            </div>
          ) : null}
          {teacher.experienceYears != null ? (
            <p className="text-xs text-slate-400">{teacher.experienceYears} yrs experience</p>
          ) : null}
          {!teacher.designation && !teacher.institute && teacher.experienceYears == null ? (
            <span className="text-xs text-slate-300">—</span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-mono text-xs">{teacher.mobile}</span>
          </div>
          {teacher.email ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {teacher.email}
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <StudentAdminBadge
          label={teacher.branch?.name ?? 'Unassigned'}
          color={teacher.branch?.name ? 'slate' : 'amber'}
        />
      </td>
      <td className="px-4 py-3.5">
        <StudentAdminBadge
          label={teacher.status}
          color={teacher.status === 'ACTIVE' ? 'green' : 'red'}
        />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => actions.onView(teacher.id)}
          >
            <Eye className="mr-1 h-3 w-3" />
            View
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => actions.onEdit(teacher.id)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          {teacher.status === 'ACTIVE' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              title="Block access"
              onClick={() => actions.onSetStatus(teacher.id, 'BLOCKED', 'Block Teacher Account')}
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Activate access"
              onClick={() => actions.onSetStatus(teacher.id, 'ACTIVE', 'Activate Teacher Account')}
            >
              <UserCheck className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            title="Delete teacher"
            onClick={() => actions.onDelete(teacher.id, teacher.fullName)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

type TeachersTableProps = {
  loading: boolean;
  sortMode: boolean;
  filteredTeachers: User[];
  orderedTeachers: User[];
  totalTeachers: number;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  actions: TeacherRowActions;
};

export function TeachersTable({
  loading,
  sortMode,
  filteredTeachers,
  orderedTeachers,
  totalTeachers,
  sensors,
  onDragEnd,
  actions,
}: TeachersTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-100 bg-slate-50">
              {sortMode ? (
                <th className="w-12 px-4 py-3" />
              ) : null}
              {[
                sortMode ? 'Teacher (drag to reorder)' : 'Teacher',
                ...(sortMode
                  ? []
                  : ['Teaching Info', 'Contact', 'Branch', 'Status', 'Actions']),
              ].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400',
                    h === 'Actions' && 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={sortMode ? 2 : 6}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  Loading teachers…
                </td>
              </tr>
            ) : (sortMode ? orderedTeachers : filteredTeachers).length === 0 ? (
              <tr>
                <td colSpan={sortMode ? 2 : 6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Users className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-semibold text-slate-500">No teachers found</p>
                    <p className="text-xs">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : sortMode ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext
                  items={orderedTeachers.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedTeachers.map((teacher) => (
                    <SortableTeacherRow key={teacher.id} teacher={teacher} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              filteredTeachers.map((teacher) => (
                <TeacherTableRow key={teacher.id} teacher={teacher} actions={actions} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredTeachers.length > 0 ? (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-700">{filteredTeachers.length}</span> of{' '}
            <span className="font-bold text-slate-700">{totalTeachers}</span> teachers
          </p>
        </div>
      ) : null}
    </>
  );
}
