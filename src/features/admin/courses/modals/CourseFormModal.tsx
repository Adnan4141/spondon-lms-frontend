'use client';

import { useEffect, useState } from 'react';
import { Eye, GraduationCap, Layers, Settings, Star, DoorOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { createCourse, updateCourse } from '@/lib/api/courses';
import type { Course, CreateCourseDto, Program, UpdateCourseDto } from '@/types/course';
import { RED } from '../courseConstants';
import { EMPTY_COURSE_FORM, type CourseForm } from '../courseTypes';
import { courseToForm, slugify } from '../courseUtils';

export function CourseFormModal({
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
                These are display-only counts shown on the public course page. Actual content is managed via the Content view.
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
