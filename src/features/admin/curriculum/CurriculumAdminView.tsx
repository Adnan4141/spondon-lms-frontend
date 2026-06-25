'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Layers,
  ListVideo,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { getCourseById } from '@/lib/api/courses';
import {
  createCurriculumNode,
  deleteCurriculumNode,
  deleteLessonResource,
  getCurriculumTree,
  reorderCurriculum,
  updateCurriculumNode,
  updateLessonResource,
} from '@/lib/api/curriculum';
import { findLessonAncestorTitles } from './curriculum-breadcrumb';
import { LessonResourceModal } from './LessonResourceModal';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { promptAction } from '@/features/admin/shared/prompt-action';
import { cn } from '@/lib/utils';
import type { CurriculumTreeNode, CurriculumVisibility, LessonResourceRow } from './curriculum-types';

function reorderSiblings(nodes: CurriculumTreeNode[], activeId: string, overId: string): CurriculumTreeNode[] | null {
  const ai = nodes.findIndex((n) => n.id === activeId);
  const oi = nodes.findIndex((n) => n.id === overId);
  if (ai === -1 || oi === -1 || ai === oi) return null;
  return arrayMove([...nodes], ai, oi);
}

function applyReorderDeep(
  nodes: CurriculumTreeNode[],
  activeId: string,
  overId: string,
): CurriculumTreeNode[] | null {
  const same = reorderSiblings(nodes, activeId, overId);
  if (same) return same;
  for (let i = 0; i < nodes.length; i++) {
    const ch = nodes[i].children;
    if (!ch?.length) continue;
    const inner = applyReorderDeep(ch, activeId, overId);
    if (inner) {
      return nodes.map((n, j) => (j === i ? { ...n, children: inner } : n));
    }
  }
  return null;
}

function flattenOrder(
  nodes: CurriculumTreeNode[],
  parentId: string | null,
): { id: string; parentId: string | null; sortOrder: number }[] {
  const out: { id: string; parentId: string | null; sortOrder: number }[] = [];
  nodes.forEach((n, i) => {
    out.push({ id: n.id, parentId, sortOrder: i });
    if (n.children?.length) out.push(...flattenOrder(n.children, n.id));
  });
  return out;
}

function typeLabel(t: string) {
  if (t === 'SUBJECT') return 'Subject';
  if (t === 'CHAPTER') return 'Chapter';
  if (t === 'LESSON') return 'Lesson';
  return t;
}

function findInTree(nodes: CurriculumTreeNode[], id: string): CurriculumTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const inner = findInTree(n.children || [], id);
    if (inner) return inner;
  }
  return null;
}

function SortableRow({
  node,
  depth,
  expanded,
  toggle,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
}: {
  node: CurriculumTreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (n: CurriculumTreeNode) => void;
  onAddChild: (n: CurriculumTreeNode, type: 'CHAPTER' | 'LESSON') => void;
  onDelete: (n: CurriculumTreeNode) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };
  const isOpen = expanded.has(node.id);
  const hasKids = (node.children?.length ?? 0) > 0;
  const hidden = node.visibility === 'HIDDEN' || node.visibility === 'DRAFT';
  const draft = node.visibility === 'DRAFT';
  const scheduled =
    node.publishAt && new Date(node.publishAt) > new Date() && node.type === 'LESSON';

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className={cn(
          'group flex items-center gap-1 rounded-lg border border-transparent px-1 py-1.5 text-sm hover:border-slate-200 hover:bg-slate-50/80',
          selectedId === node.id && 'border-indigo-200 bg-indigo-50/60',
        )}
        style={{ paddingLeft: Math.max(4, 6 + depth * 14) }}
      >
        <button
          type="button"
          className="touch-none text-slate-400 hover:text-slate-700"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-500"
          onClick={() => toggle(node.id)}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
        >
          {hasKids ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="inline-block w-4" />
          )}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left font-medium text-slate-800"
          onClick={() => onSelect(node)}
        >
          <span className="truncate">{node.title}</span>
        </button>
        <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
          #{node.sortOrder + 1}
        </Badge>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {typeLabel(node.type)}
        </Badge>
        {node.type === 'LESSON' && node.isFreePreview && (
          <Badge className="shrink-0 bg-amber-100 text-[10px] text-amber-900">Preview</Badge>
        )}
        {draft && (
          <Badge variant="outline" className="shrink-0 border-violet-200 text-[10px] text-violet-800">
            Draft
          </Badge>
        )}
        {(node.visibility === 'HIDDEN' || scheduled) && !draft && (
          <Badge variant="outline" className="shrink-0 border-amber-200 text-[10px] text-amber-800">
            {scheduled ? 'Scheduled' : 'Hidden'}
          </Badge>
        )}
        {node.type === 'LESSON' && (
          <span className="shrink-0 text-[10px] text-slate-500">
            {node.resources?.length ?? node.resourceCount ?? 0} res.
          </span>
        )}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          {node.type === 'SUBJECT' && (
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(node, 'CHAPTER')}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          {node.type === 'CHAPTER' && (
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(node, 'LESSON')}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelect(node)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => onDelete(node)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {isOpen && node.children?.length ? (
        <SortableContext
          id={`nest-${node.id}`}
          items={node.children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {node.children.map((ch) => (
            <SortableRow
              key={ch.id}
              node={ch}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      ) : null}
    </div>
  );
}

export type CurriculumAdminViewProps = {
  courseId: string;
  /** Full-page shell (default) vs compact panel inside course modal */
  variant?: 'page' | 'embedded';
  /** Shown in embedded toolbar; avoids extra API for title */
  courseNameOverride?: string;
  /** Lesson assignee list from modal draft (assigned teachers); skips course fetch for pool */
  teachersOverride?: { id: string; fullName: string }[];
};

export function CurriculumAdminView({
  courseId,
  variant = 'page',
  courseNameOverride,
  teachersOverride,
}: CurriculumAdminViewProps) {
  const embedded = variant === 'embedded';
  const { toast } = useToast();
  const [courseName, setCourseName] = useState('');
  const [tree, setTree] = useState<CurriculumTreeNode[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CurriculumTreeNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<CurriculumTreeNode | null>(null);
  const [resourceModal, setResourceModal] = useState<{ lesson: CurriculumTreeNode; edit?: LessonResourceRow | null } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    title: '',
    sortOrder: 0,
    description: '',
    visibility: 'VISIBLE' as CurriculumVisibility,
    icon: '',
    estimatedClasses: '' as string | number,
    assignedTeacherUserId: '',
    durationMinutes: '' as string | number,
    isFreePreview: false,
    publishAt: undefined as Date | undefined,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (embedded) {
        setTeachers([...(teachersOverride ?? [])]);
      } else {
        const courseRes = await getCourseById(courseId);
        if (courseRes.success && courseRes.data) {
          const c = courseRes.data as any;
          setCourseName(c.name || '');
          const pool =
            (c.teachers as any[])?.map((t) => ({
              id: t.teacher?.id || t.teacherUserId,
              fullName: t.teacher?.fullName || 'Teacher',
            })) ?? [];
          setTeachers(pool.filter((t) => t.id));
        }
      }

      const treeRes = await getCurriculumTree(courseId);
      if (treeRes.success && treeRes.data) {
        const t = ((treeRes.data as any).tree as CurriculumTreeNode[]) || [];
        setTree(t);
        setSelected((prev) => (prev ? findInTree(t, prev.id) : null));
      } else {
        setTree([]);
      }
    } catch (e: any) {
      toast({ title: 'Failed to load curriculum', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast, embedded, teachersOverride]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setDirty(false);
      return;
    }
    setForm({
      title: selected.title,
      sortOrder: selected.sortOrder,
      description: selected.description ?? '',
      visibility: (selected.visibility as CurriculumVisibility) || 'VISIBLE',
      icon: selected.icon ?? '',
      estimatedClasses: selected.estimatedClasses ?? '',
      assignedTeacherUserId: selected.assignedTeacherUserId ?? '',
      durationMinutes: selected.durationMinutes ?? '',
      isFreePreview: !!selected.isFreePreview,
      publishAt: selected.publishAt ? new Date(selected.publishAt) : undefined,
    });
    setDirty(false);
  }, [selected?.id]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = applyReorderDeep(tree, String(active.id), String(over.id));
    if (!next) return;
    setTree(next);
    const items = flattenOrder(next, null);
    try {
      const res = await reorderCurriculum(courseId, items);
      if (res.success && (res.data as any)?.tree) {
        const t = (res.data as any).tree as CurriculumTreeNode[];
        setTree(t);
        setSelected((prev) => (prev ? findInTree(t, prev.id) : null));
      } else {
        await load();
      }
    } catch (e: any) {
      toast({ title: 'Reorder failed', description: e?.message, variant: 'destructive' });
      load();
    }
  };

  const addRootSubject = async () => {
    const title = await promptAction({
      title: 'Add subject',
      description: 'Enter a title for the new subject.',
      defaultValue: 'New subject',
      placeholder: 'Subject title',
      confirmLabel: 'Add subject',
    });
    if (!title?.trim()) return;
    try {
      const res = await createCurriculumNode(courseId, {
        type: 'SUBJECT',
        title: title.trim(),
        visibility: 'VISIBLE',
      });
      if (res.success) await load();
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message, variant: 'destructive' });
    }
  };

  const onAddChild = async (parent: CurriculumTreeNode, type: 'CHAPTER' | 'LESSON') => {
    const isChapter = type === 'CHAPTER';
    const title = await promptAction({
      title: isChapter ? 'Add chapter' : 'Add lesson',
      description: isChapter ? 'Enter a title for the new chapter.' : 'Enter a title for the new lesson.',
      defaultValue: isChapter ? 'New chapter' : 'New lesson',
      placeholder: isChapter ? 'Chapter title' : 'Lesson title',
      confirmLabel: isChapter ? 'Add chapter' : 'Add lesson',
    });
    if (!title?.trim()) return;
    try {
      const res = await createCurriculumNode(courseId, {
        parentId: parent.id,
        type,
        title: title.trim(),
        visibility: 'VISIBLE',
      });
      if (res.success) {
        setExpanded((e) => new Set(e).add(parent.id));
        await load();
      }
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message, variant: 'destructive' });
    }
  };

  const saveNode = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        sortOrder: Number(form.sortOrder) || 0,
        description: form.description || null,
        visibility: form.visibility,
      };
      if (selected.type === 'SUBJECT') body.icon = form.icon || null;
      if (selected.type === 'CHAPTER') {
        const n = parseInt(String(form.estimatedClasses), 10);
        body.estimatedClasses = Number.isNaN(n) ? null : n;
      }
      if (selected.type === 'LESSON') {
        body.durationMinutes = form.durationMinutes === '' ? null : parseInt(String(form.durationMinutes), 10);
        body.isFreePreview = form.isFreePreview;
        body.publishAt = form.publishAt ? form.publishAt.toISOString() : null;
        body.assignedTeacherUserId = form.assignedTeacherUserId || null;
      }
      const res = await updateCurriculumNode(selected.id, body);
      if (res.success) {
        setDirty(false);
        toast({ title: 'Saved' });
        await load();
      }
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteCurriculumNode(deleteTarget.id);
      if (res.success) {
        toast({ title: 'Deleted' });
        if (selected?.id === deleteTarget.id) setSelected(null);
        setDeleteTarget(null);
        await load();
      }
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message, variant: 'destructive' });
    }
  };

  const patchResourceMeta = async (r: LessonResourceRow, patch: Partial<LessonResourceRow>) => {
    const m = { ...r, ...patch };
    const fd = new FormData();
    fd.append('title', m.title);
    fd.append('type', m.type);
    fd.append('isFree', String(m.isFree));
    fd.append('downloadAllowed', String(m.downloadAllowed));
    fd.append('isRequired', String(m.isRequired ?? false));
    fd.append('visibility', m.visibility ?? 'VISIBLE');
    fd.append('sortOrder', String(m.sortOrder));
    fd.append('durationMinutes', m.durationMinutes != null ? String(m.durationMinutes) : '');
    fd.append('externalUrl', m.externalUrl || '');
    fd.append('fileUrl', m.fileUrl || '');
    if (m.thumbnailUrl) fd.append('thumbnailUrl', m.thumbnailUrl);
    if (m.publishAt) fd.append('publishAt', m.publishAt);
    else fd.append('publishAt', '');
    if (m.scheduledAt) fd.append('scheduledAt', m.scheduledAt);
    else fd.append('scheduledAt', '');
    await updateLessonResource(r.id, fd);
    await load();
  };

  const rootIds = useMemo(() => tree.map((n) => n.id), [tree]);

  const displayTitle = (embedded ? (courseNameOverride?.trim() || courseName) : courseName) || 'Course';

  const mainGrid = (
    <div
      className={cn(
        'mx-auto grid w-full gap-3',
        embedded
          ? 'min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(240px,34%)_minmax(0,1fr)] lg:gap-4'
          : 'max-w-7xl flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(280px,360px)_1fr]',
      )}
    >
      <Card
        className={cn(
          'flex min-h-0 flex-col rounded-xl border-slate-200/90 shadow-sm',
          embedded ? 'min-h-0 max-h-full' : 'h-fit',
        )}
      >
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 shrink-0 text-indigo-600" />
            Structure
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn(
            'min-h-0 flex-1 overflow-y-auto pt-0',
            embedded ? 'min-h-[12rem] max-h-full' : 'max-h-[70vh]',
          )}
        >
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
              <Sparkles className="h-10 w-10 text-indigo-400" />
              <p className="max-w-xs text-sm text-slate-600">No curriculum yet. Add a subject to start building your tree.</p>
              <Button size="sm" className="rounded-xl" onClick={addRootSubject}>
                <Plus className="mr-1 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext id="root-subjects" items={rootIds} strategy={verticalListSortingStrategy}>
                {tree.map((n) => (
                  <SortableRow
                    key={n.id}
                    node={n}
                    depth={0}
                    expanded={expanded}
                    toggle={toggle}
                    selectedId={selected?.id ?? null}
                    onSelect={setSelected}
                    onAddChild={onAddChild}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <div
        className={cn(
          'flex min-h-0 flex-col gap-3',
          embedded ? 'max-h-full overflow-y-auto pr-0.5' : 'min-h-[480px]',
        )}
      >
          {!selected ? (
            <Card className="flex flex-1 flex-col items-center justify-center rounded-xl border-slate-200/90 py-16 shadow-sm">
              <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Select a node to edit</p>
              <p className="mt-1 max-w-sm text-center text-xs text-slate-500">
                Chapters go under subjects; lessons go under chapters. Use the tree on the left.
              </p>
            </Card>
          ) : (
            <>
              <Card className="rounded-xl border-slate-200/90 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{typeLabel(selected.type)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>
                      {selected.type === 'LESSON' ? 'Lesson unit (outline)' : 'Title'}
                    </Label>
                    <Input
                      className="rounded-lg"
                      value={form.title}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, title: e.target.value }));
                        setDirty(true);
                      }}
                    />
                    {selected.type === 'LESSON' && (
                      <p className="text-[11px] text-slate-500">
                        This names the lesson in the tree (e.g. “Lecture 01”). Individual videos and PDFs use
                        their own titles in “Lesson resources”.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Serial (sort order index)</Label>
                    <Input
                      type="number"
                      className="rounded-lg"
                      value={form.sortOrder}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }));
                        setDirty(true);
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      className="rounded-lg"
                      rows={3}
                      value={form.description}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, description: e.target.value }));
                        setDirty(true);
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Visibility</Label>
                    <Select
                      value={form.visibility}
                      onValueChange={(v) => {
                        setForm((f) => ({ ...f, visibility: v as CurriculumVisibility }));
                        setDirty(true);
                      }}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VISIBLE">Visible</SelectItem>
                        <SelectItem value="HIDDEN">Hidden</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selected.type === 'SUBJECT' && (
                    <div className="grid gap-2">
                      <Label>Icon (emoji or text)</Label>
                      <Input
                        className="rounded-lg"
                        value={form.icon}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, icon: e.target.value }));
                          setDirty(true);
                        }}
                        placeholder="📘"
                      />
                    </div>
                  )}
                  {selected.type === 'CHAPTER' && (
                    <div className="grid gap-2">
                      <Label>Estimated classes</Label>
                      <Input
                        type="number"
                        className="rounded-lg"
                        value={form.estimatedClasses}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, estimatedClasses: e.target.value }));
                          setDirty(true);
                        }}
                      />
                    </div>
                  )}
                  {selected.type === 'LESSON' && (
                    <>
                      <div className="grid gap-2">
                        <Label>Assigned teacher</Label>
                        <Select
                          value={form.assignedTeacherUserId || '__none__'}
                          onValueChange={(v) => {
                            setForm((f) => ({ ...f, assignedTeacherUserId: v === '__none__' ? '' : v }));
                            setDirty(true);
                          }}
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          className="rounded-lg"
                          value={form.durationMinutes}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, durationMinutes: e.target.value }));
                            setDirty(true);
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                        <Label className="text-sm">Free preview lesson</Label>
                        <Switch
                          checked={form.isFreePreview}
                          onCheckedChange={(c) => {
                            setForm((f) => ({ ...f, isFreePreview: c }));
                            setDirty(true);
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Publish at</Label>
                        <DateTimePicker
                          date={form.publishAt}
                          setDate={(d) => {
                            setForm((f) => ({ ...f, publishAt: d }));
                            setDirty(true);
                          }}
                          placeholder="Schedule go-live"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {selected.type === 'LESSON' && (
                <Card className="rounded-xl border-slate-200/90 shadow-sm">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ListVideo className="h-4 w-4 shrink-0 text-indigo-600" />
                        Lesson resources
                      </CardTitle>
                      <p className="text-xs text-slate-500">
                        Each row is a separate attachment (video, note, quiz, …) with its own student-facing title.
                      </p>
                    </div>
                    <Button size="sm" className="shrink-0 rounded-xl" onClick={() => setResourceModal({ lesson: selected, edit: null })}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add resource
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!selected.resources?.length ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-500">
                        No resources yet. Add video, PDF, links, and more.
                      </div>
                    ) : (
                      selected.resources.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{r.type}</Badge>
                              <span className="truncate font-medium text-slate-900">{r.title}</span>
                              {r.visibility === 'DRAFT' && (
                                <Badge variant="outline" className="border-violet-200 text-[10px] text-violet-800">
                                  Draft
                                </Badge>
                              )}
                              {r.visibility === 'HIDDEN' && (
                                <Badge variant="outline" className="text-[10px]">
                                  Hidden
                                </Badge>
                              )}
                              {r.isRequired && (
                                <Badge variant="outline" className="border-rose-200 text-[10px] text-rose-800">
                                  Required
                                </Badge>
                              )}
                              {r.isFree ? (
                                <Badge className="bg-emerald-100 text-[10px] text-emerald-900">Free</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-xs text-slate-500">{r.fileUrl || r.externalUrl || '—'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Download</span>
                              <Switch
                                checked={r.downloadAllowed}
                                onCheckedChange={(c) => patchResourceMeta(r, { downloadAllowed: c })}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg"
                                onClick={() => setResourceModal({ lesson: selected, edit: r })}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={async () => {
                                  if (!(await confirmAction({
                                    title: 'Delete resource?',
                                    description: 'Remove this resource from the lesson?',
                                    confirmLabel: 'Delete resource',
                                    variant: 'danger',
                                  }))) return;
                                  await deleteLessonResource(r.id);
                                  await load();
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="sticky bottom-0 z-10 mt-auto flex justify-end gap-2 border-t border-slate-200/90 bg-white/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={!dirty || !selected}
                  onClick={() => {
                    if (!selected) return;
                    const n = findInTree(tree, selected.id) || selected;
                    setForm({
                      title: n.title,
                      sortOrder: n.sortOrder,
                      description: n.description ?? '',
                      visibility: (n.visibility as CurriculumVisibility) || 'VISIBLE',
                      icon: n.icon ?? '',
                      estimatedClasses: n.estimatedClasses ?? '',
                      assignedTeacherUserId: n.assignedTeacherUserId ?? '',
                      durationMinutes: n.durationMinutes ?? '',
                      isFreePreview: !!n.isFreePreview,
                      publishAt: n.publishAt ? new Date(n.publishAt) : undefined,
                    });
                    setDirty(false);
                  }}
                >
                  Reset
                </Button>
                <Button className="rounded-xl" disabled={!dirty || saving} onClick={saveNode}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </>
          )}
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden bg-white">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outline</p>
              <p className="truncate text-xs text-slate-600 sm:text-sm">
                Drag the handle on each row to reorder. Click a row to edit details and lesson resources.
              </p>
            </div>
            <Button size="sm" className="shrink-0 rounded-lg shadow-sm" onClick={addRootSubject}>
              <Plus className="mr-1 h-4 w-4" />
              Add subject
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">{mainGrid}</div>
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50/80">
          <div className="border-b border-slate-200/80 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild className="rounded-lg">
                  <Link href="/admin/courses">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Courses
                  </Link>
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Curriculum</p>
                  <h1 className="text-lg font-bold text-slate-900">{displayTitle}</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-xl" onClick={addRootSubject}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Subject
                </Button>
              </div>
            </div>
          </div>
          {mainGrid}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the node and all nested content. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-lg bg-red-600" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LessonResourceModal
        open={!!resourceModal}
        onClose={() => setResourceModal(null)}
        lessonId={resourceModal?.lesson.id ?? ''}
        breadcrumbTitles={
          resourceModal ? findLessonAncestorTitles(tree, resourceModal.lesson.id) : []
        }
        edit={resourceModal?.edit ?? undefined}
        onSaved={async () => {
          setResourceModal(null);
          await load();
        }}
      />
    </>
  );
}
