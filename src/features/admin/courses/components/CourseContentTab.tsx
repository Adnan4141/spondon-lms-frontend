'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  Layers,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { promptAction } from '@/features/admin/shared/prompt-action';
import { createCourseContent, deleteCourseContent, getCourseContents, updateCourseContent } from '@/lib/api/courses';
import type { CourseContent } from '@/types/course-content';
import { TYPE_CONFIG } from '../courseConstants';
import { EMPTY_CONTENT_FORM, type ContentForm } from '../courseTypes';
import { groupContents } from '../courseUtils';
import { ContentItemModal } from '../modals/ContentItemModal';
import { normalizeYoutubeWatchUrl } from '@/lib/youtube';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function nextGlobalSortOrder(items: CourseContent[]): number {
  return items.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1) + 1;
}

function nextOrdersInChapter(items: CourseContent[], subject: string, chapter: string): { sortOrder: number; topicSortOrder: number } {
  const sub = subject.trim();
  const chap = chapter.trim();
  const inCh = items.filter(
    (i) => (i.subjectTitle || '').trim() === sub && (i.chapterTitle || '').trim() === chap,
  );
  const maxSort = inCh.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1);
  const maxTopic = inCh.reduce((m, i) => Math.max(m, i.topicSortOrder ?? i.sortOrder ?? 0), -1);
  return { sortOrder: maxSort + 1, topicSortOrder: maxTopic + 1 };
}

function contentToForm(item: CourseContent): ContentForm {
  return {
    subjectTitle: item.subjectTitle ?? '',
    chapterTitle: item.chapterTitle ?? '',
    title: item.title,
    topicTitle: item.topicTitle ?? '',
    type: item.type,
    fileUrl: item.fileUrl ?? '',
    textBody: item.textBody ?? '',
    isFree: item.isFree,
    sortOrder: String(item.sortOrder ?? 0),
    topicSortOrder: String(item.topicSortOrder ?? item.sortOrder ?? 0),
    durationMinutes: item.durationMinutes != null ? String(item.durationMinutes) : '',
  };
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Sortable Lesson Card ────────────────────────────────────────────────── */

function SortableLessonCard({
  item,
  isLast,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: CourseContent;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: item.id,
    data: { type: 'Lesson' }
  });
  
  const style = { transform: CSS.Translate.toString(transform), transition };
  const [isHovered, setIsHovered] = useState(false);
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.OTHER;
  const TypeIcon = cfg.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/item flex items-center gap-3 px-3 py-2.5 transition-colors relative bg-white',
        !isLast && 'border-b border-slate-50',
        isHovered && !isDragging && 'bg-slate-50/80',
        isDragging && 'z-50 shadow-lg opacity-95 ring-1 ring-slate-200 rounded-lg cursor-grabbing scale-[1.01]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className={cn(
          "flex h-8 w-6 shrink-0 items-center justify-center text-slate-300 hover:text-slate-500 cursor-grab transition-colors", 
          isDragging && 'cursor-grabbing text-slate-600'
        )}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
        <TypeIcon className={cn('h-4 w-4', cfg.textColor)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">{item.title}</span>
          {item.type === 'VIDEO' && item.durationMinutes != null && item.durationMinutes > 0 && (
            <span className="hidden shrink-0 items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex">
              <Clock className="h-2.5 w-2.5" />
              {item.durationMinutes}m
            </span>
          )}
        </div>
        {item.topicTitle && item.topicTitle !== item.title && (
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.topicTitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {item.isFree ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
            Free
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200">
            Premium
          </span>
        )}

        {item.fileUrl && (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Open resource"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <div className={cn(
          'flex items-center gap-0.5 transition-opacity duration-150',
          (isHovered || isDragging) ? 'opacity-100' : 'opacity-0',
        )}>
          <button type="button" onClick={onEdit} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} disabled={isDeleting} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sortable Module Wrapper ────────────────────────────────────────────────── */

function SortableModuleCard({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: Record<string, unknown>, isDragging: boolean) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    data: { type: 'Module' }
  });
  
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-90 shadow-2xl scale-[1.01] rounded-xl ring-2 ring-indigo-500')}>
      {children({ ...attributes, ...listeners }, isDragging)}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */

export function CourseContentTab({ courseId }: { courseId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<CourseContent | null>(null);
  const [addCtx, setAddCtx] = useState<{ subject?: string; chapter?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadContents = useCallback(async () => {
    const res = await getCourseContents({ courseId });
    if (res.success && res.data) setItems(res.data);
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    getCourseContents({ courseId })
      .then((res) => {
        if (res.success && res.data) {
          setItems(res.data);
          const grouped = groupContents(res.data);
          if (grouped.length > 0) {
            setExpandedSubjects(new Set([grouped[0].name]));
            if (grouped[0].chapters.length > 0) {
              setExpandedChapters(new Set([`${grouped[0].name}::${grouped[0].chapters[0].name}`]));
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const subjects = useMemo(() => groupContents(items), [items]);
  const existingSubjects = useMemo(() => subjects.map((s) => s.name).filter((s) => s !== '(No Subject)'), [subjects]);

  const existingChaptersBySubject = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of subjects) {
      if (s.name === '(No Subject)') continue;
      m[s.name] = s.chapters.map((c) => c.name).filter((n) => n !== '(No Chapter)');
    }
    return m;
  }, [subjects]);

  const addInitial = useMemo((): ContentForm => {
    if (addCtx === null) return EMPTY_CONTENT_FORM;
    const sub = addCtx.subject?.trim() ?? '';
    const chap = addCtx.chapter?.trim() ?? '';
    if (sub && chap) {
      const { sortOrder, topicSortOrder } = nextOrdersInChapter(items, sub, chap);
      return { ...EMPTY_CONTENT_FORM, subjectTitle: sub, chapterTitle: chap, sortOrder: String(sortOrder), topicSortOrder: String(topicSortOrder) };
    }
    if (sub) {
      const gOrder = nextGlobalSortOrder(items);
      return { ...EMPTY_CONTENT_FORM, subjectTitle: sub, sortOrder: String(gOrder), topicSortOrder: String(gOrder) };
    }
    const gOrder = nextGlobalSortOrder(items);
    return { ...EMPTY_CONTENT_FORM, sortOrder: String(gOrder), topicSortOrder: String(gOrder) };
  }, [addCtx, items]);

  useEffect(() => {
    if (addCtx === null) return;
    const sub = addCtx.subject?.trim();
    const chap = addCtx.chapter?.trim();
    if (sub) setExpandedSubjects((prev) => new Set(prev).add(sub));
    if (sub && chap) setExpandedChapters((prev) => new Set(prev).add(`${sub}::${chap}`));
  }, [addCtx]);

  /* ─── computed stats ──────────────────────────────────────────────────── */
  const totalVideos = items.filter((i) => i.type === 'VIDEO').length;
  const totalDocs = items.filter((i) => i.type === 'NOTE' || i.type === 'PDF').length;
  const totalDurationMinutes = items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);

  const toggleSubject = (name: string) => setExpandedSubjects((prev) => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const toggleChapter = (key: string) => setExpandedChapters((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const handleSave = async (form: ContentForm, attachment: { mode: 'upload' | 'link'; file: File | null }, existingId?: string) => {
    const fd = new FormData();
    fd.append('courseId', courseId);
    fd.append('type', form.type);
    fd.append('title', form.title.trim());
    if (form.subjectTitle.trim()) fd.append('subjectTitle', form.subjectTitle.trim());
    if (form.chapterTitle.trim()) fd.append('chapterTitle', form.chapterTitle.trim());
    const topic = (form.topicTitle || form.title).trim();
    fd.append('topicTitle', topic);
    if (attachment.mode === 'link' && form.fileUrl.trim()) {
      fd.append('fileUrl', form.type === 'VIDEO' ? normalizeYoutubeWatchUrl(form.fileUrl.trim()) ?? form.fileUrl.trim() : form.fileUrl.trim());
    }
    if (attachment.mode === 'upload' && attachment.file) fd.append('file', attachment.file);
    if (form.textBody) fd.append('textBody', form.textBody);
    fd.append('isFree', String(form.isFree));
    if (!Number.isNaN(parseInt(String(form.sortOrder), 10))) fd.append('sortOrder', String(parseInt(String(form.sortOrder), 10)));
    if (!Number.isNaN(parseInt(String(form.topicSortOrder), 10))) fd.append('topicSortOrder', String(parseInt(String(form.topicSortOrder), 10)));
    if (form.type === 'VIDEO' && form.durationMinutes.trim()) {
      const dm = parseInt(form.durationMinutes, 10);
      if (!Number.isNaN(dm) && dm >= 0) fd.append('durationMinutes', String(dm));
    }

    const res = existingId ? await updateCourseContent(existingId, fd) : await createCourseContent(fd);
    if (!res.success) throw new Error((res as { message?: string }).message ?? 'Save failed');
    await loadContents();
    toast({ description: existingId ? 'Lesson updated!' : 'Lesson added!' });
    setAddCtx(null);
    setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmAction({
      title: 'Delete lesson?',
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete lesson',
      variant: 'danger',
    }))) return;
    setDeletingId(id);
    try {
      const res = await deleteCourseContent(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast({ description: 'Lesson deleted' });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenameModule = async (oldName: string) => {
    const newName = await promptAction({
      title: 'Rename subject',
      description: `Enter a new name for "${oldName}".`,
      defaultValue: oldName,
      placeholder: 'Subject name',
      confirmLabel: 'Rename',
    });
    if (!newName || newName === oldName) return;
    const trimmed = newName;
    
    // Optimistic UI updates
    setItems((prev) => prev.map(i => i.subjectTitle === oldName ? { ...i, subjectTitle: trimmed } : i));
    setExpandedSubjects((prev) => {
      const s = new Set(prev);
      if (s.has(oldName)) { s.delete(oldName); s.add(trimmed); }
      return s;
    });

    const itemsToUpdate = items.filter(i => i.subjectTitle === oldName);
    try {
      await Promise.all(itemsToUpdate.map(item => {
        const fd = new FormData();
        fd.append('subjectTitle', trimmed);
        return updateCourseContent(item.id, fd);
      }));
      toast({ description: `Subject renamed to ${trimmed}` });
    } catch {
      toast({ variant: 'destructive', description: 'Some lessons failed to rename within the subject.' });
      loadContents(); // revert on fail
    }
  };

  const handleDeleteModule = async (moduleName: string) => {
    if (!(await confirmAction({
      title: 'Delete subject?',
      description: `Delete the subject "${moduleName}" and all its items?`,
      confirmLabel: 'Delete subject',
      variant: 'danger',
    }))) return;
    setIsDeletingModule(moduleName);
    
    // Optimistic UI update
    const itemsToDelete = items.filter(i => i.subjectTitle === moduleName);
    setItems(prev => prev.filter(i => i.subjectTitle !== moduleName));

    try {
      await Promise.all(itemsToDelete.map(item => deleteCourseContent(item.id)));
      toast({ description: 'Subject deleted' });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to delete subject.' });
      loadContents();
    } finally {
      setIsDeletingModule(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Module Dragging
    if (String(active.id).startsWith('Module:::')) {
      const activeModule = String(active.id).replace('Module:::', '');
      const overModule = String(over.id).replace('Module:::', '');
      
      const oldIndex = subjects.findIndex(s => s.name === activeModule);
      const newIndex = subjects.findIndex(s => s.name === overModule);
      if (oldIndex === -1 || newIndex === -1) return;
      
      const reorderedSubjects = arrayMove(subjects, oldIndex, newIndex);
      
      // Compute flat items globally sequential
      const flattenedItems: CourseContent[] = [];
      reorderedSubjects.forEach(subj => {
         subj.chapters.forEach(chap => flattenedItems.push(...chap.items));
      });
      
      const newGlobalItems = [...items];
      flattenedItems.forEach((item, index) => {
        const sOrder = index + 1;
        const gIdx = newGlobalItems.findIndex(i => i.id === item.id);
        if (gIdx !== -1 && newGlobalItems[gIdx].sortOrder !== sOrder) {
          newGlobalItems[gIdx] = { ...newGlobalItems[gIdx], sortOrder: sOrder, topicSortOrder: sOrder };
          const fd = new FormData();
          fd.append('sortOrder', String(sOrder));
          fd.append('topicSortOrder', String(sOrder));
          updateCourseContent(item.id, fd).catch(()=>console.error('Failed sync'));
        }
      });
      setItems(newGlobalItems);
      return;
    }

    // Lesson Dragging
    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) return;
    
    const chapItems = items.filter(i => i.subjectTitle === activeItem.subjectTitle && i.chapterTitle === activeItem.chapterTitle).sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    
    const oldIndex = chapItems.findIndex(i => i.id === active.id);
    const newIndex = chapItems.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderedItems = arrayMove(chapItems, oldIndex, newIndex);
    const existingOrders = [...chapItems].map(i => i.sortOrder ?? 0).sort((a,b) => a - b);
    
    const newGlobalItems = [...items];
    newOrderedItems.forEach((item, index) => {
      const targetSortOrder = existingOrders[index];
      const globalIndex = newGlobalItems.findIndex(i => i.id === item.id);
      
      if (globalIndex !== -1 && newGlobalItems[globalIndex].sortOrder !== targetSortOrder) {
        newGlobalItems[globalIndex] = { ...newGlobalItems[globalIndex], sortOrder: targetSortOrder };
        const fd = new FormData();
        fd.append('sortOrder', String(targetSortOrder));
        updateCourseContent(item.id, fd).catch(()=>console.error('Failed sync'));
      }
    });
    setItems(newGlobalItems);
  };

  /* ─── loading skeleton ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-100" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            <div className="ml-6 h-10 animate-pulse rounded-lg bg-slate-50" style={{ width: `${85 - i * 10}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* ─── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { label: 'Subjects',       val: subjects.length,   icon: <BookOpen className="h-4 w-4" />,    tc: 'text-violet-700', bg: 'bg-violet-100',  gradient: 'bg-gradient-to-br from-violet-50 to-fuchsia-50/60',  border: 'border-violet-200/60' },
          { label: 'Lessons',       val: items.length,      icon: <Layers className="h-4 w-4" />,      tc: 'text-blue-700',   bg: 'bg-blue-100',    gradient: 'bg-gradient-to-br from-blue-50 to-sky-50/60',    border: 'border-blue-200/60' },
          { label: 'Video Lessons', val: totalVideos,       icon: <PlayCircle className="h-4 w-4" />,  tc: 'text-indigo-700', bg: 'bg-indigo-100',  gradient: 'bg-gradient-to-br from-indigo-50 to-blue-50/60',  border: 'border-indigo-200/60' },
          { label: 'Documents',     val: totalDocs,         icon: <FileText className="h-4 w-4" />,    tc: 'text-emerald-700',bg: 'bg-emerald-100', gradient: 'bg-gradient-to-br from-emerald-50 to-teal-50/60', border: 'border-emerald-200/60' },
          ...(totalDurationMinutes > 0
            ? [{ label: 'Total Duration', val: formatDuration(totalDurationMinutes), icon: <Clock className="h-4 w-4" />, tc: 'text-rose-700', bg: 'bg-rose-100', gradient: 'bg-gradient-to-br from-rose-50 to-orange-50/60', border: 'border-rose-200/60' }]
            : []),
        ].map((c) => (
          <div key={c.label} className={cn('group relative flex items-center gap-3.5 rounded-xl border p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5', c.gradient, c.border)}>
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm bg-white/60 bg-blend-overlay', c.tc)}>
              {c.icon}
            </div>
            <div className="min-w-0">
              <p className={cn('text-xl font-black leading-none tracking-tight', c.tc)}>{c.val}</p>
              <p className={cn('mt-1 text-[11px] font-bold tracking-wide uppercase', c.tc, 'opacity-70')}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">
          {subjects.length > 0 ? `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} · ${items.length} lesson${items.length !== 1 ? 's' : ''}` : 'No content'}
        </p>
        <Button onClick={() => { setEditItem(null); setAddCtx({}); }} className="gap-2 rounded-lg bg-slate-900 px-4 text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md">
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>

      {subjects.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
            <FolderOpen className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No subjects yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
            Start building your course by adding the first lesson. Lessons are grouped into subjects and chapters — the same structure students see.
          </p>
          <Button onClick={() => { setEditItem(null); setAddCtx({}); }} className="mt-5 gap-2 rounded-lg bg-indigo-600 px-5 text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add First Lesson
          </Button>
        </div>
      )}

      {/* Global Drag Context for everything */}
      {subjects.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-5">
            <SortableContext items={subjects.map(s => `Module:::${s.name}`)} strategy={verticalListSortingStrategy}>
              {subjects.map((subj) => {
                const isOpen = expandedSubjects.has(subj.name);
                const totalItems = subj.chapters.reduce((s, c) => s + c.items.length, 0);
                const moduleDuration = subj.chapters.flatMap((c) => c.items).reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
                const isHovered = hoveredModule === subj.name;
                const isDeleting = isDeletingModule === subj.name;

                return (
                  <SortableModuleCard key={subj.name} id={`Module:::${subj.name}`}>
                    {(dragHandleProps, isModuleDragging) => (
                      <div
                        className={cn(
                          'overflow-hidden rounded-xl border bg-white transition-all duration-300 relative',
                          isOpen ? 'border-indigo-100 shadow-md ring-1 ring-indigo-50' : 'border-slate-200/80 shadow-sm',
                          isHovered && !isOpen && !isModuleDragging && 'border-slate-300 shadow-md',
                          isDeleting && 'opacity-50 pointer-events-none'
                        )}
                        onMouseEnter={() => setHoveredModule(subj.name)}
                        onMouseLeave={() => setHoveredModule(null)}
                      >
                        {/* Module Header */}
                        <div className={cn(
                            'flex items-center justify-between px-3 py-4 transition-colors',
                            isOpen ? 'bg-gradient-to-r from-indigo-50/60 to-white' : 'bg-white hover:bg-slate-50/70',
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pl-2">
                            {/* Drag handle for Module */}
                            <div {...dragHandleProps} className={cn("cursor-grab text-slate-300 hover:text-slate-500", isModuleDragging && 'cursor-grabbing')}>
                              <GripVertical className="h-5 w-5" />
                            </div>

                            <div onClick={() => toggleSubject(subj.name)} className="flex items-center gap-4 flex-1 cursor-pointer min-w-0">
                              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm border", isOpen ? 'bg-indigo-100 border-indigo-200/50' : 'bg-white border-slate-200')}>
                                <BookOpen className={cn("h-5 w-5", isOpen ? 'text-indigo-600' : 'text-slate-500')} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-black text-slate-800 truncate select-none">{subj.name}</span>
                                  {moduleDuration > 0 && (
                                    <span className="hidden shrink-0 items-center gap-1 text-[11px] font-bold text-slate-400 sm:inline-flex bg-slate-100 px-2 py-0.5 rounded-full">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(moduleDuration)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1 font-medium select-none">
                                   {subj.chapters.length} {subj.chapters.length === 1 ? 'chapter' : 'chapters'} • {totalItems} {totalItems === 1 ? 'lesson' : 'lessons'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pr-2">
                            {/* Hover Actions */}
                            <div className={cn(
                              'flex items-center gap-1 transition-opacity duration-200',
                              (isHovered || isOpen) ? 'opacity-100' : 'opacity-0',
                            )}>
                              <button type="button" onClick={() => setAddCtx({ subject: subj.name })} className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-100">
                                <Plus className="h-3.5 w-3.5" /> Add Lesson
                              </button>
                              
                              {/* Module Edit Options */}
                              <div className="flex gap-1 border-l border-slate-200 ml-1 pl-1">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleRenameModule(subj.name); }} title="Rename Subject" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteModule(subj.name); }} title="Delete Subject" className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <button onClick={() => toggleSubject(subj.name)} className={cn('flex h-8 w-8 ml-2 items-center justify-center rounded-md transition-colors', isOpen ? 'bg-slate-200/70' : 'bg-transparent hover:bg-slate-100')}>
                              {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                            </button>
                          </div>
                        </div>

                        {/* Sections & Lessons */}
                        {isOpen && (
                          <div className="border-t border-indigo-100 bg-slate-50/30">
                            {subj.chapters.map((chap, cIdx) => {
                              const chapKey = `${subj.name}::${chap.name}`;
                              const chapOpen = expandedChapters.has(chapKey);
                              const sectionDuration = chap.items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);

                              return (
                                <div key={chap.name} className={cn("border-b border-indigo-50/50", cIdx === subj.chapters.length - 1 && "border-b-0")}>
                                  <div className={cn('flex cursor-pointer items-center justify-between px-5 py-3 pl-[60px] transition-colors relative', chapOpen ? 'bg-indigo-50/30' : 'hover:bg-slate-100/60')} onClick={() => toggleChapter(chapKey)}>
                                    <div className="absolute left-[42px] top-0 bottom-0 w-px bg-indigo-100" />
                                    <div className="flex items-center gap-3 min-w-0 relative z-10">
                                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm text-slate-400">
                                        {chapOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                      </div>
                                      <span className="text-[14px] font-bold text-slate-700">{chap.name}</span>
                                      <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm">
                                        {chap.items.length} items
                                      </span>
                                      {sectionDuration > 0 && (
                                        <span className="hidden items-center gap-1 text-[11px] font-medium text-slate-400 sm:inline-flex">
                                          <Clock className="h-3 w-3" />
                                          {formatDuration(sectionDuration)}
                                        </span>
                                      )}
                                    </div>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditItem(null); setAddCtx({ subject: subj.name, chapter: chap.name }); }} className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold text-indigo-600 opacity-0 transition-all hover:bg-indigo-50 group-hover:opacity-100 [div:hover>&]:opacity-100">
                                      <Plus className="h-3 w-3" /> Add
                                    </button>
                                  </div>

                                  {/* Lesson Items */}
                                  {chapOpen && chap.items.length > 0 && (
                                    <div className="pl-[34px]">
                                      <div className="ml-[6px] border-l border-indigo-100">
                                        <SortableContext items={chap.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                          {chap.items.map((item, idx) => (
                                            <div key={item.id} className="relative">
                                              <div className="absolute left-0 top-1/2 w-4 h-px bg-indigo-100 -translate-y-1/2" />
                                              <div className="ml-4">
                                                <SortableLessonCard
                                                  item={item}
                                                  isLast={idx === chap.items.length - 1}
                                                  onEdit={() => { setAddCtx(null); setEditItem(item); }}
                                                  onDelete={() => handleDelete(item.id)}
                                                  isDeleting={deletingId === item.id}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </SortableContext>
                                      </div>
                                    </div>
                                  )}

                                  {/* Empty section */}
                                  {chapOpen && chap.items.length === 0 && (
                                    <div className="ml-[54px] border-l border-indigo-100 px-6 py-5">
                                      <p className="text-xs text-slate-400 font-medium">No lessons in this chapter</p>
                                      <button type="button" onClick={() => { setEditItem(null); setAddCtx({ subject: subj.name, chapter: chap.name }); }} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-400">
                                        <Plus className="h-3.5 w-3.5" /> Add First Lesson
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </SortableModuleCard>
                );
              })}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────── */}
      {addCtx !== null && (
        <ContentItemModal
          open
          mode="add"
          onClose={() => setAddCtx(null)}
          existingSubjects={existingSubjects}
          existingChaptersBySubject={existingChaptersBySubject}
          initial={addInitial}
          onSave={(form, attachment) => handleSave(form, attachment)}
        />
      )}
      {editItem && (
        <ContentItemModal
          open
          mode="edit"
          onClose={() => setEditItem(null)}
          existingSubjects={existingSubjects}
          existingChaptersBySubject={existingChaptersBySubject}
          initial={contentToForm(editItem)}
          onSave={(form, attachment) => handleSave(form, attachment, editItem.id)}
        />
      )}
    </div>
  );
}
