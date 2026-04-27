'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, FileText, Layers, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createCourseContent, deleteCourseContent, getCourseContents, updateCourseContent } from '@/lib/api/courses';
import type { CourseContent } from '@/types/course-content';
import { TYPE_CONFIG } from '../courseConstants';
import { EMPTY_CONTENT_FORM, type ContentForm } from '../courseTypes';
import { groupContents } from '../courseUtils';
import { ContentItemModal } from '../modals/ContentItemModal';

export function CourseContentTab({ courseId }: { courseId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<CourseContent | null>(null);
  const [addCtx, setAddCtx] = useState<{ subject?: string; chapter?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContents = useCallback(async () => {
    const res = await getCourseContents({ courseId });
    if (res.success && res.data) setItems(res.data);
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    getCourseContents({ courseId }).then(res => {
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
    }).finally(() => setLoading(false));
  }, [courseId]);

  const subjects = useMemo(() => groupContents(items), [items]);
  const existingSubjects = useMemo(() => subjects.map(s => s.name).filter(s => s !== '(No Subject)'), [subjects]);

  const totalVideos = items.filter(i => i.type === 'VIDEO').length;
  const totalNotes  = items.filter(i => i.type === 'NOTE' || i.type === 'PDF').length;

  const toggleSubject = (name: string) => setExpandedSubjects(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const toggleChapter = (key: string) => setExpandedChapters(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const handleSave = async (
    form: ContentForm,
    attachment: { mode: 'upload' | 'link'; file: File | null },
    existingId?: string
  ) => {
    const fd = new FormData();
    fd.append('courseId', courseId);
    fd.append('type', form.type);
    fd.append('title', form.title);
    if (form.subjectTitle) fd.append('subjectTitle', form.subjectTitle);
    if (form.chapterTitle) fd.append('chapterTitle', form.chapterTitle);
    fd.append('topicTitle', form.topicTitle || form.title);
    if (attachment.mode === 'link' && form.fileUrl) fd.append('fileUrl', form.fileUrl);
    if (attachment.mode === 'upload' && attachment.file) fd.append('file', attachment.file);
    if (form.textBody) fd.append('textBody', form.textBody);
    fd.append('isFree', String(form.isFree));

    const res = existingId ? await updateCourseContent(existingId, fd) : await createCourseContent(fd);
    if (!res.success) throw new Error((res as { message?: string }).message ?? 'Save failed');
    await loadContents();
    toast({ description: existingId ? 'Content updated!' : 'Content added!' });
    setAddCtx(null); setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    setDeletingId(id);
    try {
      const res = await deleteCourseContent(id);
      if (res.success) { setItems(prev => prev.filter(i => i.id !== id)); toast({ description: 'Content deleted' }); }
    } finally { setDeletingId(null); }
  };

  if (loading) {
    return <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Subjects', val: subjects.length,  icon: <BookOpen className="h-4 w-4" />, tc: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Items',    val: items.length,      icon: <Layers   className="h-4 w-4" />, tc: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Videos',   val: totalVideos,        icon: <Video    className="h-4 w-4" />, tc: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Notes/PDFs', val: totalNotes,      icon: <FileText className="h-4 w-4" />, tc: 'text-emerald-600',bg: 'bg-emerald-50'},
        ].map(c => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', c.bg, c.tc)}>{c.icon}</div>
            <div>
              <p className={cn('text-xl font-black leading-none', c.tc)}>{c.val}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddCtx({})} className="gap-2 text-white bg-black hover:bg-black/90">
          <Plus className="h-4 w-4" /> Add Content
        </Button>
      </div>

      {subjects.length === 0 && (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No content yet.</p>
          <p className="text-slate-400 text-xs mt-1">Click Add Content to start adding lectures and materials.</p>
        </div>
      )}

      <div className="space-y-3">
        {subjects.map(subj => {
          const isOpen = expandedSubjects.has(subj.name);
          const totalItems = subj.chapters.reduce((s, c) => s + c.items.length, 0);
          return (
            <div key={subj.name} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer" onClick={() => toggleSubject(subj.name)}>
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  <span className="font-bold text-sm text-slate-900">{subj.name}</span>
                  <span className="text-[11px] text-slate-400">{totalItems} items</span>
                </div>
                <button onClick={e => { e.stopPropagation(); setAddCtx({ subject: subj.name }); }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {isOpen && (
                <div className="divide-y divide-slate-100">
                  {subj.chapters.map(chap => {
                    const chapKey = `${subj.name}::${chap.name}`;
                    const chapOpen = expandedChapters.has(chapKey);
                    return (
                      <div key={chap.name} className="bg-white">
                        <div className="flex items-center justify-between px-4 pl-10 py-2.5 cursor-pointer bg-slate-50/50" onClick={() => toggleChapter(chapKey)}>
                          <div className="flex items-center gap-2">
                            {chapOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                            <span className="text-sm font-semibold text-slate-700">{chap.name}</span>
                            <span className="text-[11px] text-slate-400">{chap.items.length} items</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setAddCtx({ subject: subj.name, chapter: chap.name }); }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        </div>
                        {chapOpen && chap.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead><tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Title</th>
                                <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Type</th>
                                <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Link</th>
                                <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Access</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                              </tr></thead>
                              <tbody>
                                {chap.items.map(item => {
                                  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.OTHER;
                                  return (
                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                      <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[200px] truncate">{item.title}</td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', cfg.bg, cfg.textColor)}>{cfg.label}</span>
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        {item.fileUrl ? (
                                          <a href={item.fileUrl} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                                            <ExternalLink className="h-3 w-3" /> View
                                          </a>
                                        ) : item.textBody ? (
                                          <span className="text-xs text-blue-500 font-medium">Text ✓</span>
                                        ) : <span className="text-slate-300">—</span>}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        {item.isFree
                                          ? <span className="text-[11px] font-bold text-emerald-600">Free</span>
                                          : <span className="text-[11px] text-slate-400">Paid</span>}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <div className="flex gap-1.5 justify-end">
                                          <button onClick={() => setEditItem(item)}
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                            <Pencil className="h-3 w-3" /> Edit
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs flex items-center transition-colors disabled:opacity-40">
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addCtx !== null && (
        <ContentItemModal open onClose={() => setAddCtx(null)} existingSubjects={existingSubjects}
          initial={{ ...EMPTY_CONTENT_FORM, subjectTitle: addCtx.subject ?? '', chapterTitle: addCtx.chapter ?? '' }}
          onSave={(form, attachment) => handleSave(form, attachment)} />
      )}
      {editItem && (
        <ContentItemModal open onClose={() => setEditItem(null)} existingSubjects={existingSubjects}
          initial={{ subjectTitle: editItem.subjectTitle ?? '', chapterTitle: editItem.chapterTitle ?? '',
            title: editItem.title, topicTitle: editItem.topicTitle ?? '', type: editItem.type,
            fileUrl: editItem.fileUrl ?? '', textBody: editItem.textBody ?? '', isFree: editItem.isFree }}
          onSave={(form, attachment) => handleSave(form, attachment, editItem.id)} />
      )}
    </div>
  );
}

// ─── COURSE DETAIL VIEW ───────────────────────────────────────────────────────
