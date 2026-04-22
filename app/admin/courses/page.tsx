'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen, Layers, Video, FileText, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, Search, X, ExternalLink,
  Star, Eye, EyeOff, DoorOpen, DoorClosed, ToggleLeft, ToggleRight,
  GraduationCap, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import {
  getCourses, getCourseContents,
  createCourse, updateCourse,
  createCourseContent, updateCourseContent, deleteCourseContent,
  toggleCourseVisibility, toggleCourseFeatured,
} from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import type { Course, Program, CreateCourseDto, UpdateCourseDto } from '@/types/course';
import type { CourseContent, ContentType } from '@/types/course-content';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const RED = '#c8102e';

const TYPE_CONFIG: Record<ContentType, { label: string; textColor: string; bg: string }> = {
  VIDEO:    { label: 'Video',    textColor: 'text-rose-600',   bg: 'bg-rose-50'   },
  NOTE:     { label: 'Note',     textColor: 'text-blue-600',   bg: 'bg-blue-50'   },
  PDF:      { label: 'PDF',      textColor: 'text-violet-600', bg: 'bg-violet-50' },
  SYLLABUS: { label: 'Syllabus', textColor: 'text-emerald-600',bg: 'bg-emerald-50'},
  LEAFLET:  { label: 'Leaflet',  textColor: 'text-amber-600',  bg: 'bg-amber-50'  },
  SAMPLE:   { label: 'Sample',   textColor: 'text-cyan-600',   bg: 'bg-cyan-50'   },
  OTHER:    { label: 'Other',    textColor: 'text-slate-500',  bg: 'bg-slate-100' },
};

const CONTENT_TYPES: ContentType[] = ['VIDEO', 'NOTE', 'PDF', 'SYLLABUS', 'LEAFLET', 'SAMPLE', 'OTHER'];

// ─── CONTENT TYPES ────────────────────────────────────────────────────────────

interface SubjectGroup { name: string; chapters: ChapterGroup[]; }
interface ChapterGroup { name: string; items: CourseContent[]; }
interface ContentForm {
  subjectTitle: string; chapterTitle: string; title: string;
  topicTitle: string; type: ContentType; fileUrl: string;
  textBody: string; isFree: boolean;
}

const EMPTY_FORM: ContentForm = {
  subjectTitle: '', chapterTitle: '', title: '', topicTitle: '',
  type: 'VIDEO', fileUrl: '', textBody: '', isFree: true,
};

// ─── COURSE FORM TYPES ────────────────────────────────────────────────────────

interface CourseForm {
  // Basic
  name: string;
  slug: string;
  programId: string;
  grade: string;
  group: string;
  type: 'ONLINE' | 'OFFLINE';
  admissionStatus: 'OPEN' | 'CLOSED';
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  startMonth: string;
  durationMonths: string;
  description: string;
  branchAccessMode: string;
  settledOptionEnabled: boolean;
  // Website
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  heroTitle: string;
  whyTakeTitle: string;
  // Pricing
  fee: string;
  offerPrice: string;
  bookPrice: string;
  includePrintedBooks: boolean;
  // Content counts (display)
  lectureCount: string;
  examCount: string;
  noteCount: string;
  bookCount: string;
}

const EMPTY_COURSE_FORM: CourseForm = {
  name: '', slug: '', programId: '', grade: '', group: '',
  type: 'ONLINE', admissionStatus: 'OPEN', status: 'ACTIVE',
  startMonth: '', durationMonths: '', description: '',
  branchAccessMode: 'ALL_BRANCH', settledOptionEnabled: false,
  featured: false, websiteVisible: true, enrollmentVisible: true,
  heroTitle: '', whyTakeTitle: '',
  fee: '', offerPrice: '', bookPrice: '', includePrintedBooks: false,
  lectureCount: '', examCount: '', noteCount: '', bookCount: '',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function groupContents(items: CourseContent[]): SubjectGroup[] {
  const subjectMap = new Map<string, Map<string, CourseContent[]>>();
  for (const item of items) {
    const subj = item.subjectTitle?.trim() || '(No Subject)';
    const chap = item.chapterTitle?.trim() || '(No Chapter)';
    if (!subjectMap.has(subj)) subjectMap.set(subj, new Map());
    const chapMap = subjectMap.get(subj)!;
    if (!chapMap.has(chap)) chapMap.set(chap, []);
    chapMap.get(chap)!.push(item);
  }
  return Array.from(subjectMap.entries()).map(([name, chapMap]) => ({
    name,
    chapters: Array.from(chapMap.entries()).map(([chapName, chapItems]) => ({
      name: chapName,
      items: [...chapItems].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    })),
  }));
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function courseToForm(course: Course): CourseForm {
  const outline = (course.outline && typeof course.outline === 'object' && !Array.isArray(course.outline))
    ? course.outline as Record<string, unknown>
    : {};
  return {
    name: course.name,
    slug: course.slug,
    programId: course.programId,
    grade: course.grade ?? '',
    group: course.group ?? '',
    type: course.type,
    admissionStatus: course.admissionStatus,
    status: course.status,
    startMonth: course.startMonth ?? '',
    durationMonths: course.durationMonths != null ? String(course.durationMonths) : '',
    description: course.description ?? '',
    branchAccessMode: course.branchAccessMode ?? 'ALL_BRANCH',
    settledOptionEnabled: course.settledOptionEnabled,
    featured: course.featured,
    websiteVisible: course.websiteVisible,
    enrollmentVisible: course.enrollmentVisible,
    heroTitle: (outline.heroTitle as string) ?? '',
    whyTakeTitle: (outline.whyTakeTitle as string) ?? '',
    fee: String(course.fee ?? ''),
    offerPrice: course.offerPrice != null ? String(course.offerPrice) : '',
    bookPrice: course.bookPrice != null ? String(course.bookPrice) : '',
    includePrintedBooks: Boolean(outline.includePrintedBooks),
    lectureCount: String(outline.lectureCount ?? ''),
    examCount: String(outline.examCount ?? ''),
    noteCount: String(outline.noteCount ?? ''),
    bookCount: String(outline.bookCount ?? ''),
  };
}

// ─── CONTENT ITEM MODAL ───────────────────────────────────────────────────────

function ContentItemModal({
  open, onClose, onSave, initial, existingSubjects,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: ContentForm) => Promise<void>;
  initial: ContentForm;
  existingSubjects: string[];
}) {
  const [form, setForm] = useState<ContentForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setForm(initial); setError(''); setSaving(false); }, [open]);

  const set = <K extends keyof ContentForm>(k: K, v: ContentForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.subjectTitle.trim()) { setError('Subject is required'); return; }
    if (!form.chapterTitle.trim()) { setError('Chapter is required'); return; }
    setSaving(true); setError('');
    try { await onSave(form); } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 max-h-[92vh] w-[95vw] sm:max-w-xl flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">Content Item</DialogTitle>
        <DialogDescription className="sr-only">Course content item form</DialogDescription>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">Add / Edit Content Item</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details for this lecture / material</p>
          </div>
          <button onClick={onClose} className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject <span className="text-rose-600">*</span></label>
            <Input list="subjects-dl" value={form.subjectTitle} onChange={e => set('subjectTitle', e.target.value)} placeholder="e.g. Physics" />
            <datalist id="subjects-dl">{existingSubjects.map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Chapter <span className="text-rose-600">*</span></label>
            <Input value={form.chapterTitle} onChange={e => set('chapterTitle', e.target.value)} placeholder="e.g. Chapter ১ — Motion" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title <span className="text-rose-600">*</span></label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. লেকচার 01 — Basic Concepts" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Content Type</label>
            <div className="flex gap-2 flex-wrap">
              {CONTENT_TYPES.map(t => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button key={t} onClick={() => set('type', t)} type="button"
                    className={cn('px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                      form.type === t ? `${cfg.bg} ${cfg.textColor} border-current` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">File / URL</label>
            <Input value={form.fileUrl} onChange={e => set('fileUrl', e.target.value)}
              placeholder={form.type === 'VIDEO' ? 'https://youtube.com/watch?v=...' : 'https://...'} />
          </div>
          {(form.type === 'NOTE' || form.type === 'OTHER') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Text / Notes</label>
              <textarea value={form.textBody} onChange={e => set('textBody', e.target.value)}
                placeholder="Paste note content..." rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('isFree', !form.isFree)}
              className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer',
                form.isFree ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300')}>
              {form.isFree && <span className="text-white text-[10px] font-black">✓</span>}
            </button>
            <label className="text-sm text-slate-700 font-medium cursor-pointer" onClick={() => set('isFree', !form.isFree)}>
              Free access (visible without login)
            </label>
          </div>
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="text-white" style={{ background: RED }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── COURSE FORM MODAL (4 tabs) ───────────────────────────────────────────────

function CourseFormModal({
  open, onClose, onSaved, initial, programs,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (course: Course) => void;
  initial: Course | null;
  programs: Program[];
}) {
  const [form, setForm] = useState<CourseForm>(EMPTY_COURSE_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (open) {
      setForm(initial ? courseToForm(initial) : EMPTY_COURSE_FORM);
      setError('');
      setSaving(false);
      setActiveTab('basic');
    }
  }, [open, initial]);

  const set = <K extends keyof CourseForm>(k: K, v: CourseForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: initial ? f.slug : slugify(name) }));
  };

  const fee = Number(form.fee) || 0;
  const offer = Number(form.offerPrice) || 0;
  const discountPct = fee > 0 && offer > 0 && offer < fee ? Math.round((1 - offer / fee) * 100) : 0;

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Course name is required'); setActiveTab('basic'); return; }
    if (!form.programId) { setError('Program is required'); setActiveTab('basic'); return; }
    if (!form.fee || Number(form.fee) <= 0) { setError('Course fee is required'); setActiveTab('pricing'); return; }

    setSaving(true); setError('');
    try {
      const outlineExtra = {
        heroTitle: form.heroTitle || undefined,
        whyTakeTitle: form.whyTakeTitle || undefined,
        includePrintedBooks: form.includePrintedBooks || undefined,
        lectureCount: form.lectureCount ? Number(form.lectureCount) : undefined,
        examCount: form.examCount ? Number(form.examCount) : undefined,
        noteCount: form.noteCount ? Number(form.noteCount) : undefined,
        bookCount: form.bookCount ? Number(form.bookCount) : undefined,
      };

      const dto: CreateCourseDto | UpdateCourseDto = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        programId: form.programId,
        grade: form.grade || undefined,
        group: form.group || undefined,
        type: form.type,
        admissionStatus: form.admissionStatus,
        status: form.status,
        startMonth: form.startMonth || null,
        durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
        description: form.description || undefined,
        branchAccessMode: form.branchAccessMode,
        settledOptionEnabled: form.settledOptionEnabled,
        featured: form.featured,
        websiteVisible: form.websiteVisible,
        enrollmentVisible: form.enrollmentVisible,
        fee: Number(form.fee),
        offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
        bookPrice: form.bookPrice ? Number(form.bookPrice) : null,
        outline: outlineExtra as unknown as import('@/types/course').JsonValue,
      };

      const res = initial
        ? await updateCourse(initial.id, dto as UpdateCourseDto)
        : await createCourse(dto as CreateCourseDto);

      if (!res.success || !res.data) throw new Error((res as { message?: string }).message ?? 'Save failed');
      onSaved(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 max-h-[93vh] w-[98vw] sm:max-w-2xl flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">{initial ? 'Edit Course' : 'Create Course'}</DialogTitle>
        <DialogDescription className="sr-only">Course form</DialogDescription>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">{initial ? 'Edit Course' : 'Create Course'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{initial ? initial.name : 'Fill in the details below'}</p>
          </div>
          <button onClick={onClose} className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b px-4 h-10 bg-white gap-1 shrink-0">
              {[
                { id: 'basic', label: 'Basic', icon: <Settings className="h-3.5 w-3.5" /> },
                { id: 'website', label: 'Website', icon: <Eye className="h-3.5 w-3.5" /> },
                { id: 'pricing', label: 'Pricing', icon: <GraduationCap className="h-3.5 w-3.5" /> },
                { id: 'content', label: 'Content', icon: <Layers className="h-3.5 w-3.5" /> },
              ].map(t => (
                <TabsTrigger key={t.id} value={t.id}
                  className="flex items-center gap-1.5 text-xs font-bold data-[state=active]:text-rose-600 data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-none px-3 h-full">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab 1: Basic */}
            <TabsContent value="basic" className="flex-1 overflow-y-auto p-5 space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Course Name <span className="text-rose-600">*</span></label>
                  <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. HSC Physics Special Batch" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Slug</label>
                  <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" className="font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Program <span className="text-rose-600">*</span></label>
                  <Select value={form.programId} onValueChange={v => set('programId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Grade</label>
                  <Select value={form.grade || '_none'} onValueChange={v => set('grade', v === '_none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— None —</SelectItem>
                      {['SSC', 'HSC', 'Admission', 'Junior', 'Cadet', 'Job'].map(g =>
                        <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Group</label>
                  <Select value={form.group || '_none'} onValueChange={v => set('group', v === '_none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— None —</SelectItem>
                      {['Science', 'Commerce', 'Arts', 'General'].map(g =>
                        <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                  <div className="flex gap-2">
                    {(['ONLINE', 'OFFLINE'] as const).map(t => (
                      <button key={t} type="button" onClick={() => set('type', t)}
                        className={cn('flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                          form.type === t ? 'bg-indigo-50 text-indigo-700 border-indigo-500' : 'bg-white text-slate-500 border-slate-200')}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <Select value={form.status} onValueChange={v => set('status', v as CourseForm['status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DISABLED">Disabled</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Admission Status</label>
                  <div className="flex gap-2">
                    {(['OPEN', 'CLOSED'] as const).map(s => (
                      <button key={s} type="button" onClick={() => set('admissionStatus', s)}
                        className={cn('flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                          form.admissionStatus === s
                            ? s === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-rose-50 text-rose-700 border-rose-500'
                            : 'bg-white text-slate-500 border-slate-200')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Month</label>
                  <Input type="month" value={form.startMonth} onChange={e => set('startMonth', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (months)</label>
                  <Input type="number" min={1} value={form.durationMonths} onChange={e => set('durationMonths', e.target.value)} placeholder="e.g. 12" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Branch Access</label>
                  <Select value={form.branchAccessMode} onValueChange={v => set('branchAccessMode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_BRANCH">All Branches</SelectItem>
                      <SelectItem value="SPECIFIC_BRANCH">Specific Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    rows={3} placeholder="Short description for this course…"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => set('settledOptionEnabled', !form.settledOptionEnabled)}
                    className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0',
                      form.settledOptionEnabled ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300')}>
                    {form.settledOptionEnabled && <span className="text-white text-[10px] font-black">✓</span>}
                  </button>
                  <label className="text-sm text-slate-700 font-medium cursor-pointer" onClick={() => set('settledOptionEnabled', !form.settledOptionEnabled)}>
                    Enable settle option for this course
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Website */}
            <TabsContent value="website" className="flex-1 overflow-y-auto p-5 space-y-5 mt-0">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Visibility</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { key: 'featured' as const, label: 'Featured', sub: 'Show in featured section', icon: <Star className="h-5 w-5 text-amber-500" /> },
                    { key: 'websiteVisible' as const, label: 'Website Visible', sub: 'Show on public site', icon: <Eye className="h-5 w-5 text-blue-500" /> },
                    { key: 'enrollmentVisible' as const, label: 'Open for Enrollment', sub: 'Students can enroll', icon: <DoorOpen className="h-5 w-5 text-emerald-500" /> },
                  ]).map(item => (
                    <button key={item.key} type="button" onClick={() => set(item.key, !form[item.key])}
                      className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer text-center',
                        form[item.key] ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300')}>
                      {item.icon}
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.sub}</span>
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full',
                        form[item.key] ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500')}>
                        {form[item.key] ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hero / Page Title</label>
                <Input value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="e.g. HSC Physics — Comprehensive Prep" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Why Take Section Title</label>
                <Input value={form.whyTakeTitle} onChange={e => set('whyTakeTitle', e.target.value)} placeholder="e.g. কেন এই কোর্সটি করবেন?" />
              </div>
            </TabsContent>

            {/* Tab 3: Pricing */}
            <TabsContent value="pricing" className="flex-1 overflow-y-auto p-5 space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Course Fee (৳) <span className="text-rose-600">*</span></label>
                  <Input type="number" min={0} value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Offer Price (৳)</label>
                  <Input type="number" min={0} value={form.offerPrice} onChange={e => set('offerPrice', e.target.value)} placeholder="e.g. 1200" />
                </div>
              </div>
              {discountPct > 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="text-2xl font-black text-emerald-600">{discountPct}% off</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">৳{offer.toLocaleString()} effective price</p>
                    <p className="text-xs text-emerald-600">Saving ৳{(fee - offer).toLocaleString()} from regular fee</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Book / Material Price (৳)</label>
                <Input type="number" min={0} value={form.bookPrice} onChange={e => set('bookPrice', e.target.value)} placeholder="e.g. 300" />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => set('includePrintedBooks', !form.includePrintedBooks)}
                  className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0',
                    form.includePrintedBooks ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300')}>
                  {form.includePrintedBooks && <span className="text-white text-[10px] font-black">✓</span>}
                </button>
                <label className="text-sm text-slate-700 font-medium cursor-pointer" onClick={() => set('includePrintedBooks', !form.includePrintedBooks)}>
                  Include printed books in course fee
                </label>
              </div>
            </TabsContent>

            {/* Tab 4: Content counts */}
            <TabsContent value="content" className="flex-1 overflow-y-auto p-5 space-y-4 mt-0">
              <p className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                These are display-only counts shown on the public course page. Actual content is managed via the "Content" view.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lectures</label>
                  <Input type="number" min={0} value={form.lectureCount} onChange={e => set('lectureCount', e.target.value)} placeholder="e.g. 120" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exams</label>
                  <Input type="number" min={0} value={form.examCount} onChange={e => set('examCount', e.target.value)} placeholder="e.g. 30" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <Input type="number" min={0} value={form.noteCount} onChange={e => set('noteCount', e.target.value)} placeholder="e.g. 60" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Books</label>
                  <Input type="number" min={0} value={form.bookCount} onChange={e => set('bookCount', e.target.value)} placeholder="e.g. 5" />
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500">Associated courses are managed separately via the course association tool.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
          <p className={cn('text-xs font-semibold', error ? 'text-rose-600' : 'invisible')}>{error || 'ok'}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="text-white" style={{ background: RED }}>
              {saving ? 'Saving…' : (initial ? 'Update Course' : 'Create Course')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── COURSE CONTENT TAB ───────────────────────────────────────────────────────

function CourseContentTab({ courseId }: { courseId: string }) {
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

  const handleSave = async (form: ContentForm, existingId?: string) => {
    const fd = new FormData();
    fd.append('courseId', courseId);
    fd.append('type', form.type);
    fd.append('title', form.title);
    if (form.subjectTitle) fd.append('subjectTitle', form.subjectTitle);
    if (form.chapterTitle) fd.append('chapterTitle', form.chapterTitle);
    fd.append('topicTitle', form.topicTitle || form.title);
    if (form.fileUrl) fd.append('fileUrl', form.fileUrl);
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
          { label: 'Videos',   val: totalVideos,        icon: <Video    className="h-4 w-4" />, tc: 'text-rose-600',   bg: 'bg-rose-50'   },
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
        <Button onClick={() => setAddCtx({})} className="gap-2 text-white" style={{ background: RED }}>
          <Plus className="h-4 w-4" /> Add Content
        </Button>
      </div>

      {subjects.length === 0 && (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No content yet.</p>
          <p className="text-slate-400 text-xs mt-1">Click "Add Content" to start adding lectures and materials.</p>
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
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer">
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
                                            className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold hover:underline">
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
                                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded-lg text-xs flex items-center transition-colors disabled:opacity-40">
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
          initial={{ ...EMPTY_FORM, subjectTitle: addCtx.subject ?? '', chapterTitle: addCtx.chapter ?? '' }}
          onSave={form => handleSave(form)} />
      )}
      {editItem && (
        <ContentItemModal open onClose={() => setEditItem(null)} existingSubjects={existingSubjects}
          initial={{ subjectTitle: editItem.subjectTitle ?? '', chapterTitle: editItem.chapterTitle ?? '',
            title: editItem.title, topicTitle: editItem.topicTitle ?? '', type: editItem.type,
            fileUrl: editItem.fileUrl ?? '', textBody: editItem.textBody ?? '', isFree: editItem.isFree }}
          onSave={form => handleSave(form, editItem.id)} />
      )}
    </div>
  );
}

// ─── COURSE DETAIL VIEW ───────────────────────────────────────────────────────

function CourseDetailView({ course, onBack }: { course: Course; onBack: () => void }) {
  const typeCfg = course.type === 'OFFLINE'
    ? { label: 'Offline', tc: 'text-amber-600', bg: 'bg-amber-50' }
    : { label: 'Online',  tc: 'text-blue-600',  bg: 'bg-blue-50'  };
  const statusCfg = course.status === 'ACTIVE'
    ? { tc: 'text-emerald-600', bg: 'bg-emerald-50' }
    : { tc: 'text-slate-500',   bg: 'bg-slate-100'  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Button variant="outline" onClick={onBack} className="gap-1.5 text-sm h-8 px-3">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Courses
        </Button>
        <span className="text-slate-400 text-sm">/</span>
        <span className="text-sm font-bold text-slate-700">{course.name}</span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', typeCfg.bg, typeCfg.tc)}>{typeCfg.label}</span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', statusCfg.bg, statusCfg.tc)}>{course.status}</span>
      </div>
      <div className="rounded-xl p-5 mb-5 flex items-center gap-4" style={{ background: '#0f172a' }}>
        <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <BookOpen className="h-6 w-6 text-rose-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-white truncate">{course.name}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-white/50">{(course as Course & { program?: { name: string } }).program?.name ?? course.programId}</span>
            <span className="text-sm font-bold text-rose-400">৳{Number(course.fee).toLocaleString()}/mo</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">slug</p>
          <p className="font-mono text-xs font-bold text-rose-400 mt-0.5">{course.slug}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4 text-rose-600" />
          <h3 className="text-sm font-black text-slate-900">Course Content</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Organize subjects, chapters, and lecture materials</p>
        <CourseContentTab courseId={course.id} />
      </div>
    </div>
  );
}

// ─── COURSES LIST VIEW (TABLE) ────────────────────────────────────────────────

function CoursesListView({
  onSelectContent,
}: {
  onSelectContent: (c: Course) => void;
}) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editCourse, setEditCourse] = useState<Course | null | 'new'>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const reload = useCallback(async () => {
    const [cRes, pRes] = await Promise.all([getCourses({ limit: 200 }), getPrograms()]);
    if (cRes.success && cRes.data) setCourses(cRes.data);
    if (pRes.success && pRes.data) setPrograms(pRes.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const filtered = useMemo(() => courses.filter(c => {
    const matchSearch = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || c.slug.toLowerCase().includes(search.toLowerCase());
    const matchProgram = programFilter === 'ALL' || c.programId === programFilter;
    const matchStatus  = statusFilter  === 'ALL' || c.status    === statusFilter;
    return matchSearch && matchProgram && matchStatus;
  }), [courses, search, programFilter, statusFilter]);

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

  const handleSaved = (saved: Course) => {
    setCourses(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setEditCourse(null);
    toast({ description: editCourse === 'new' ? 'Course created!' : 'Course updated!' });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Course Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">{courses.length} courses total</p>
        </div>
        <Button onClick={() => setEditCourse('new')} className="gap-2 text-white" style={{ background: RED }}>
          <Plus className="h-4 w-4" /> Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
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
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                statusFilter === s ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}
              style={statusFilter === s ? { background: RED } : {}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No courses found.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Program</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pricing</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(course => {
                  const fee = Number(course.fee);
                  const offer = course.offerPrice ? Number(course.offerPrice) : null;
                  const pct = offer && offer < fee ? Math.round((1 - offer / fee) * 100) : 0;
                  const prog = programs.find(p => p.id === course.programId);
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Course name + slug */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-rose-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{course.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{course.slug}</p>
                          </div>
                        </div>
                      </td>
                      {/* Program */}
                      <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">{prog?.name ?? '—'}</td>
                      {/* Type */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',
                          course.type === 'ONLINE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}>
                          {course.type}
                        </span>
                      </td>
                      {/* Pricing */}
                      <td className="px-4 py-3 text-right">
                        {offer && pct > 0 ? (
                          <div>
                            <span className="text-[10px] text-slate-400 line-through">৳{fee.toLocaleString()}</span>
                            <span className="ml-1 font-bold text-sm" style={{ color: RED }}>৳{offer.toLocaleString()}</span>
                            <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded">{pct}%</span>
                          </div>
                        ) : (
                          <span className="font-bold text-sm" style={{ color: RED }}>৳{fee.toLocaleString()}</span>
                        )}
                      </td>
                      {/* Website toggles */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" title={course.featured ? 'Featured (click to unfeature)' : 'Not featured (click to feature)'}
                            onClick={() => handleToggleFeatured(course)}
                            disabled={!!toggling[course.id + '_f']}
                            className={cn('p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40',
                              course.featured ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-white border-slate-200 text-slate-300 hover:text-amber-400')}>
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title={course.websiteVisible ? 'Visible (click to hide)' : 'Hidden (click to show)'}
                            onClick={() => handleToggleVisible(course)}
                            disabled={!!toggling[course.id + '_v']}
                            className={cn('p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40',
                              course.websiteVisible ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-300 hover:text-blue-400')}>
                            {course.websiteVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" title={course.admissionStatus === 'OPEN' ? 'Admission OPEN (click to close)' : 'Admission CLOSED (click to open)'}
                            onClick={() => handleToggleAdmission(course)}
                            disabled={!!toggling[course.id + '_a']}
                            className={cn('p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40',
                              course.admissionStatus === 'OPEN' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-rose-50 border-rose-300 text-rose-500')}>
                            {course.admissionStatus === 'OPEN' ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',
                          course.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700'
                          : course.status === 'DISABLED' ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-500')}>
                          {course.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setEditCourse(course)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button onClick={() => onSelectContent(course)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200">
                            <Layers className="h-3 w-3" /> Content
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> Featured</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-blue-500" /> Website Visible</span>
            <span className="flex items-center gap-1">
              <DoorOpen className="h-3 w-3 text-emerald-500" /> Admission Open
              <span className="mx-1">/</span>
              <DoorClosed className="h-3 w-3 text-rose-400" /> Closed
            </span>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <CourseFormModal
        open={editCourse !== null}
        onClose={() => setEditCourse(null)}
        onSaved={handleSaved}
        initial={editCourse === 'new' || editCourse === null ? null : editCourse}
        programs={programs}
      />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  const [contentCourse, setContentCourse] = useState<Course | null>(null);
  return (
    <>
      {contentCourse ? (
        <CourseDetailView course={contentCourse} onBack={() => setContentCourse(null)} />
      ) : (
        <CoursesListView onSelectContent={setContentCourse} />
      )}
      <Toaster />
    </>
  );
}
