'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  DoorClosed,
  DoorOpen,
  Eye,
  GripVertical,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getCourses,
  reorderCourses,
  toggleCourseFeatured,
  toggleCourseVisibility,
  updateCourse,
} from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getUsers, type User } from '@/lib/api/users';
import type { Course, Program } from '@/types/course';
import { CourseFormModal } from '../modals/CourseFormModal';
import { CourseTableRow, SortableCourseTableRow } from './CourseTableRow';

function rowProps(
  programs: Program[],
  toggling: Record<string, boolean>,
  handlers: {
    onToggleFeatured: (c: Course) => void;
    onToggleVisible: (c: Course) => void;
    onToggleAdmission: (c: Course) => void;
    onEdit: (c: Course) => void;
    onContent: (c: Course) => void;
  },
) {
  return {
    programs,
    toggling,
    ...handlers,
  };
}

export function CoursesListView({
  onSelectContent,
}: {
  onSelectContent: (c: Course) => void;
}) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editCourse, setEditCourse] = useState<Course | null | 'new'>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  const [sortMode, setSortMode] = useState(false);
  const [orderedCourses, setOrderedCourses] = useState<Course[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  const reload = useCallback(async () => {
    const [cRes, pRes, tRes] = await Promise.all([
      getCourses({ limit: 200 }),
      getPrograms(),
      getUsers({ role: 'TEACHER', status: 'ACTIVE', limit: 500 }),
    ]);
    if (cRes.success && cRes.data) setCourses(cRes.data);
    if (pRes.success && pRes.data) setPrograms(pRes.data);
    if (tRes.success && tRes.data) setTeachers(tRes.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    setOrderedCourses(courses);
  }, [courses]);

  const filtered = useMemo(() => courses.filter(c => {
    const matchSearch = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || c.slug.toLowerCase().includes(search.toLowerCase());
    const matchProgram = programFilter === 'ALL' || c.programId === programFilter;
    const matchStatus  = statusFilter  === 'ALL' || c.status    === statusFilter;
    return matchSearch && matchProgram && matchStatus;
  }), [courses, search, programFilter, statusFilter]);

  /** Drag reorder applies to full catalog order — requires default filters. */
  const canReorder =
    !search.trim() && programFilter === 'ALL' && statusFilter === 'ALL';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const optimisticPatch = (id: string, patch: Partial<Course>) =>
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const handleToggleFeatured = async (course: Course) => {
    if (toggling[course.id + '_f']) return;
    setToggling(t => ({ ...t, [course.id + '_f']: true }));
    optimisticPatch(course.id, { featured: !course.featured });
    try {
      const res = await toggleCourseFeatured(course.id);
      if (res.success && res.data) optimisticPatch(course.id, { featured: res.data.featured });
    } catch { optimisticPatch(course.id, { featured: course.featured }); }
    finally { setToggling(t => ({ ...t, [course.id + '_f']: false })); }
  };

  const handleToggleVisible = async (course: Course) => {
    if (toggling[course.id + '_v']) return;
    setToggling(t => ({ ...t, [course.id + '_v']: true }));
    optimisticPatch(course.id, { websiteVisible: !course.websiteVisible });
    try {
      const res = await toggleCourseVisibility(course.id);
      if (res.success && res.data) optimisticPatch(course.id, { websiteVisible: res.data.websiteVisible });
    } catch { optimisticPatch(course.id, { websiteVisible: course.websiteVisible }); }
    finally { setToggling(t => ({ ...t, [course.id + '_v']: false })); }
  };

  const handleToggleAdmission = async (course: Course) => {
    if (toggling[course.id + '_a']) return;
    const next = course.admissionStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setToggling(t => ({ ...t, [course.id + '_a']: true }));
    optimisticPatch(course.id, { admissionStatus: next });
    try {
      const res = await updateCourse(course.id, { admissionStatus: next });
      if (res.success && res.data) optimisticPatch(course.id, { admissionStatus: res.data.admissionStatus });
    } catch { optimisticPatch(course.id, { admissionStatus: course.admissionStatus }); }
    finally { setToggling(t => ({ ...t, [course.id + '_a']: false })); }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedCourses((items) => {
      const oldIndex = items.findIndex((c) => c.id === active.id);
      const newIndex = items.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const payload = orderedCourses.map((c, i) => ({ id: c.id, displayOrder: i }));
      const res = await reorderCourses(payload);
      if (!res.success) {
        toast({ description: res.message || 'Failed to save order', variant: 'destructive' });
        return;
      }
      await reload();
      setSortMode(false);
      toast({ description: 'Course order saved.', variant: 'success' });
    } catch {
      toast({ description: 'Failed to save order.', variant: 'destructive' });
    } finally {
      setSavingOrder(false);
    }
  };

  const shared = rowProps(programs, toggling, {
    onToggleFeatured: handleToggleFeatured,
    onToggleVisible: handleToggleVisible,
    onToggleAdmission: handleToggleAdmission,
    onEdit: setEditCourse,
    onContent: onSelectContent,
  });

  const handleSaved = (saved: Course) => {
    setCourses(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setEditCourse(null);
    toast({ description: editCourse === 'new' ? 'Course created!' : 'Course updated!' });
  };

  const sortIds = orderedCourses.map((c) => c.id);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Course Manager</h1>
          <p className="mt-0.5 text-sm text-slate-500">{courses.length} courses total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!canReorder || loading || courses.length === 0}
            title={
              !canReorder
                ? 'Clear search and set filters to “All” to reorder courses'
                : undefined
            }
            className={cn(
              'gap-2 border-slate-200',
              sortMode && 'border-indigo-400 bg-indigo-50 text-indigo-800',
            )}
            onClick={() => {
              if (sortMode) setOrderedCourses(courses);
              setSortMode((s) => !s);
            }}
          >
            <GripVertical className="h-4 w-4" />
            {sortMode ? 'Cancel reorder' : 'Reorder'}
          </Button>
          {sortMode && (
            <Button
              type="button"
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={savingOrder}
              onClick={handleSaveOrder}
            >
              {savingOrder ? 'Saving…' : 'Save order'}
            </Button>
          )}
          {!sortMode && (
            <Button onClick={() => setEditCourse('new')} className="gap-2 bg-black text-white">
              <Plus className="h-4 w-4" /> Create Course
            </Button>
          )}
        </div>
      </div>

      {sortMode && canReorder && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <GripVertical className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <p className="text-sm font-medium text-indigo-900">
            Drag rows by the handle to set catalog order (homepage / listings use this order). Click{' '}
            <span className="font-bold">Save order</span> when done.
          </p>
        </div>
      )}

      {!sortMode && (
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…" className="pl-9" />
          </div>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Programs</SelectItem>
              {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            {(['ALL', 'ACTIVE', 'DISABLED', 'ARCHIVED'] as const).map(s => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={cn('cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                  statusFilter === s
                    ? 'border-transparent bg-black text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300')}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No courses found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {sortMode && canReorder ? (
                    <th className="w-11 border-r border-slate-100 px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400" aria-hidden />
                  ) : null}
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Course</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 md:table-cell">Program</th>
                  <th className="hidden px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Pricing</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Website</th>
                  <th className="hidden px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortMode && canReorder ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
                      {orderedCourses.map(course => (
                        <SortableCourseTableRow key={course.id} {...shared} course={course} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  filtered.map(course => (
                    <CourseTableRow key={course.id} {...shared} course={course} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!sortMode && (
            <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> Featured</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-blue-500" /> Website Visible</span>
              <span className="flex items-center gap-1">
                <DoorOpen className="h-3 w-3 text-emerald-500" /> Admission Open
                <span className="mx-1">/</span>
                <DoorClosed className="h-3 w-3 text-slate-500" /> Closed
              </span>
            </div>
          )}
        </div>
      )}

      <CourseFormModal
        open={editCourse !== null}
        onClose={() => setEditCourse(null)}
        onSaved={handleSaved}
        initial={editCourse === 'new' || editCourse === null ? null : editCourse}
        programs={programs}
        teachers={teachers}
      />
    </div>
  );
}
