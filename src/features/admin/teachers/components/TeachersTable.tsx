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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Ban,
  Building2,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  GripVertical,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '../teachers-page-utils';

function SortableTeacherRow({ teacher }: { teacher: User }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: teacher.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="bg-white hover:bg-indigo-50/30 transition-colors select-none"
    >
      <TableCell className="py-4 px-4 w-12">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </TableCell>
      <TableCell className="py-4 px-4" colSpan={5}>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-indigo-50 to-white text-indigo-600 font-black text-sm shadow-sm border border-indigo-100 overflow-hidden">
            {teacher.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)}
                alt={teacher.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              teacher.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            )}
          </div>
          <div>
            <p className="text-base font-black text-slate-900">{teacher.fullName}</p>
            {teacher.designation ? (
              <p className="text-xs text-slate-500 font-semibold">{teacher.designation}</p>
            ) : null}
          </div>
        </div>
      </TableCell>
    </TableRow>
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
    <TableRow className="group transition-all hover:bg-slate-50/50">
      <TableCell className="py-6 px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-indigo-50 to-white text-indigo-600 font-black text-base shadow-sm border border-indigo-100 transition-transform group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
            {teacher.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)}
                alt={teacher.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              teacher.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            )}
          </div>
          <button type="button" className="cursor-pointer text-left" onClick={() => actions.onView(teacher.id)}>
            <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
              {teacher.fullName}
            </p>
            {teacher.createdAt ? (
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-0.5">
                <Clock className="h-3 w-3" />
                {timeAgo(teacher.createdAt)}
              </p>
            ) : null}
          </button>
        </div>
      </TableCell>
      <TableCell className="py-6 px-6">
        <div className="space-y-1">
          {teacher.designation ? (
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              {teacher.designation}
            </div>
          ) : null}
          {teacher.institute ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Building2 className="h-3 w-3 text-slate-300 shrink-0" />
              {teacher.institute}
            </div>
          ) : null}
          {teacher.experienceYears != null ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Clock className="h-3 w-3 text-slate-300 shrink-0" />
              {teacher.experienceYears} yrs exp
            </div>
          ) : null}
          {!teacher.designation && !teacher.institute && teacher.experienceYears == null ? (
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Not set</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="py-6 px-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
              <Phone className="h-3 w-3" />
            </div>
            {teacher.mobile}
          </div>
          {teacher.email ? (
            <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <Mail className="h-3 w-3" />
              </div>
              {teacher.email}
            </div>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="py-6 px-6">
        <div className="flex items-center gap-2.5 text-sm font-black text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
            <Building2 className="h-4 w-4" />
          </div>
          {teacher.branch?.name ?? (
            <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Unassigned</span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-6 px-6">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all',
            teacher.status === 'ACTIVE'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
              : 'border-rose-100 bg-rose-50 text-rose-700 group-hover:bg-rose-100',
          )}
        >
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full animate-pulse',
              teacher.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500',
            )}
          />
          {teacher.status}
        </div>
      </TableCell>
      <TableCell className="py-6 px-8 text-right">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all border border-transparent hover:border-indigo-100"
            onClick={() => actions.onView(teacher.id)}
            title="View Profile"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all border border-transparent hover:border-indigo-100"
            onClick={() => actions.onEdit(teacher.id)}
            title="Edit Profile"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {teacher.status === 'ACTIVE' ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all border border-transparent hover:border-rose-100"
              title="Block Access"
              onClick={() => actions.onSetStatus(teacher.id, 'BLOCKED', 'Block Teacher Account')}
            >
              <Ban className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md transition-all border border-transparent hover:border-emerald-100"
              title="Activate Access"
              onClick={() => actions.onSetStatus(teacher.id, 'ACTIVE', 'Activate Teacher Account')}
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all border border-transparent hover:border-rose-100"
            title="Delete Teacher"
            onClick={() => actions.onDelete(teacher.id, teacher.fullName)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
    <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
      <div className="flex items-center justify-between border-b border-slate-50 px-8 py-7">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Teachers list</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live list
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-indigo-50 text-indigo-700 font-black rounded-full px-4 py-1.5 border-0 text-[11px] tracking-tight"
        >
          {loading ? 'Loading…' : `${filteredTeachers.length} teachers`}
        </Badge>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-20" />
          <p className="text-sm font-black uppercase tracking-widest">Loading teachers</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Users className="h-16 w-16 mb-4 opacity-10" />
          <p className="text-lg font-black text-slate-300">No teachers found.</p>
          <p className="text-sm font-medium mt-1">Change filters or search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-50">
                {sortMode ? (
                  <TableHead className="h-14 px-4 w-12 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400" />
                ) : null}
                <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {sortMode ? 'Teacher (drag to reorder)' : 'Teacher'}
                </TableHead>
                {!sortMode ? (
                  <>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Teaching Info
                    </TableHead>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Contact
                    </TableHead>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Branch
                    </TableHead>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="h-14 px-8 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Actions
                    </TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortMode ? (
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
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-slate-50/50 border-t border-slate-50 px-8 py-5 flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-3 w-3" />
          Showing {filteredTeachers.length} of {totalTeachers}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Pages</span>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-white">
            <ChevronRight className="h-3 w-3 rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs font-black bg-white shadow-sm border border-slate-100 text-indigo-600"
          >
            1
          </Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-white">
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}
