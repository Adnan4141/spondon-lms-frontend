'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronsUpDown,
  Eye,
  GraduationCap,
  Image as ImageIcon,
  ImageOff,
  Layers,
  Link2,
  Plus,
  Settings,
  Star,
  DoorOpen,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  createCourse,
  updateCourse,
  getCourseById,
  addCourseTeacher,
  removeCourseTeacher,
  uploadCourseThumbnail,
} from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import { getBooks, type Book } from '@/lib/api/books';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getCourseBooks, addCourseBook, updateCourseBook, removeCourseBook } from '@/lib/api/course-books';
import { getCourseBranches, syncCourseBranches } from '@/lib/api/course-branches';
import type { User } from '@/lib/api/users';
import {
  newPublicCourseSidebarFeatureId,
  type Course,
  type CreateCourseDto,
  type Program,
  type UpdateCourseDto,
} from '@/types/course';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { EMPTY_COURSE_FORM, type CourseForm, type CourseFormSidebarFeature } from '../courseTypes';
import { courseToForm } from '../courseUtils';
import { BranchMultiSelect } from '../components/BranchMultiSelect';

export type CourseFormBookLink = { bookId: string; isFree: boolean };

export function CourseFormModal({
  open,
  onClose,
  onSaved,
  initial,
  programs,
  teachers,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (course: Course) => void;
  initial: Course | null;
  programs: Program[];
  teachers: User[];
}) {
  const [form, setForm] = useState<CourseForm>(EMPTY_COURSE_FORM);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [initialTeacherIds, setInitialTeacherIds] = useState<string[]>([]);
  const [courseBooksDraft, setCourseBooksDraft] = useState<CourseFormBookLink[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
  const [teacherQuery, setTeacherQuery] = useState('');
  const [bookSearchOpen, setBookSearchOpen] = useState(false);
  const [bookQuery, setBookQuery] = useState('');
  const [sidebarIconPickerId, setSidebarIconPickerId] = useState<string | null>(null);
  const [thumbUseUrl, setThumbUseUrl] = useState(false);
  const [thumbUseFile, setThumbUseFile] = useState(false);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbDropActive, setThumbDropActive] = useState(false);
  const [urlPreviewError, setUrlPreviewError] = useState(false);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [allowedBranchIds, setAllowedBranchIds] = useState<string[]>([]);
  const thumbFileInputRef = useRef<HTMLInputElement | null>(null);

  const syncThumbToggles = useCallback((thumbnail?: string | null) => {
    if (thumbnail?.trim()) {
      setThumbUseUrl(true);
      setThumbUseFile(false);
    } else {
      setThumbUseUrl(false);
      setThumbUseFile(false);
    }
    setThumbFile(null);
  }, []);

  useEffect(() => {
    if (open) {
      setForm(initial ? courseToForm(initial) : EMPTY_COURSE_FORM);
      setSelectedTeacherIds([]);
      setInitialTeacherIds([]);
      setCourseBooksDraft([]);
      setError('');
      setSaving(false);
      setActiveTab('basic');
      setTeacherQuery('');
      setBookQuery('');
      setTeacherSearchOpen(false);
      setBookSearchOpen(false);
      setSidebarIconPickerId(null);
      syncThumbToggles(initial?.thumbnail);
      setAllowedBranchIds([]);
    }
  }, [open, initial, syncThumbToggles]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await getBranches();
        if (res.success && res.data) setAllBranches(res.data);
      } catch {
        setAllBranches([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !initial?.id) return;
    void (async () => {
      try {
        const res = await getCourseBranches(initial.id);
        if (res.success && res.data) {
          setAllowedBranchIds(res.data.map((cb) => cb.branchId));
        }
      } catch {
        setAllowedBranchIds([]);
      }
    })();
  }, [open, initial?.id]);

  useEffect(() => {
    if (!open) return;
    getBooks({ limit: 500 }).then((r) => {
      if (r.success && r.data) setAllBooks(r.data);
    });
  }, [open]);

  useEffect(() => {
    if (!open || !initial?.id) return;
    let cancelled = false;
    getCourseById(initial.id).then((res) => {
      if (!res.success || !res.data || cancelled) return;
      const full = res.data as import('@/types/course').CourseDetails;
      setForm(courseToForm(full));
      syncThumbToggles(full.thumbnail);
      const ids = (full.teachers ?? [])
        .map((t) => t.teacher?.id)
        .filter((id): id is string => Boolean(id));
      setSelectedTeacherIds(ids);
      setInitialTeacherIds(ids);
      const links: CourseFormBookLink[] = (full.courseBooks ?? []).map((cb) => ({
        bookId: cb.bookId,
        isFree: Boolean(cb.isFree),
      }));
      setCourseBooksDraft(links);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, initial?.id, syncThumbToggles]);

  const bookById = useMemo(() => new Map(allBooks.map((b) => [b.id, b])), [allBooks]);

  const inheritedBookTotal = useMemo(
    () =>
      courseBooksDraft
        .filter((b) => !b.isFree)
        .reduce((acc, b) => acc + Number(bookById.get(b.bookId)?.price ?? 0), 0),
    [courseBooksDraft, bookById]
  );

  useEffect(() => {
    if (courseBooksDraft.length === 0) return;
    setForm((f) => ({ ...f, bookPrice: String(inheritedBookTotal) }));
  }, [inheritedBookTotal, courseBooksDraft.length]);

  const set = <K extends keyof CourseForm>(k: K, v: CourseForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const resolveThumbDisplaySrc = (u: string) => {
    const t = u.trim();
    if (!t) return '';
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    if (t.startsWith('/')) return `${API_ORIGIN}${t}`;
    return t;
  };

  const thumbObjectUrl = useMemo(() => (thumbFile ? URL.createObjectURL(thumbFile) : ''), [thumbFile]);
  useEffect(() => {
    return () => {
      if (thumbObjectUrl) URL.revokeObjectURL(thumbObjectUrl);
    };
  }, [thumbObjectUrl]);

  const thumbTab = thumbUseFile ? 'file' : thumbUseUrl ? 'url' : 'none';

  useEffect(() => {
    setUrlPreviewError(false);
  }, [form.thumbnail, thumbUseFile, thumbUseUrl]);

  const onThumbTabChange = (v: string) => {
    if (v === 'none') {
      setThumbUseUrl(false);
      setThumbUseFile(false);
      setThumbFile(null);
    } else if (v === 'url') {
      setThumbUseUrl(true);
      setThumbUseFile(false);
      setThumbFile(null);
    } else if (v === 'file') {
      setThumbUseFile(true);
      setThumbUseUrl(false);
      set('thumbnail', '');
    }
  };

  const pickThumbFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setThumbFile(file);
  };

  const handleThumbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbDropActive(false);
    const f = e.dataTransfer.files?.[0];
    pickThumbFile(f ?? null);
  };

  const handleThumbDrag = (e: React.DragEvent, over: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types?.includes('Files')) {
      try {
        e.dataTransfer.dropEffect = 'copy';
      } catch {
        /* ignore */
      }
    }
    setThumbDropActive(over);
  };

  const previewSrc = useMemo(() => {
    if (thumbUseFile && thumbObjectUrl) return thumbObjectUrl;
    if (thumbUseUrl && form.thumbnail.trim()) return resolveThumbDisplaySrc(form.thumbnail);
    if (!thumbUseUrl && !thumbUseFile && initial?.thumbnail?.trim()) {
      return resolveThumbDisplaySrc(initial.thumbnail);
    }
    return null;
  }, [thumbUseFile, thumbObjectUrl, thumbUseUrl, form.thumbnail, initial?.thumbnail]);

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name }));
  };

  const fee = Number(form.fee) || 0;
  const offer = Number(form.offerPrice) || 0;
  const discountPct = fee > 0 && offer > 0 && offer < fee ? Math.round((1 - offer / fee) * 100) : 0;

  const filteredTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        (t.email?.toLowerCase().includes(q) ?? false) ||
        t.mobile?.toLowerCase().includes(q)
    );
  }, [teachers, teacherQuery]);

  const filteredBooksForPick = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    const picked = new Set(courseBooksDraft.map((d) => d.bookId));
    let list = allBooks.filter((b) => !picked.has(b.id));
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.sku.toLowerCase().includes(q) ||
          (b.author?.toLowerCase().includes(q) ?? false)
      );
    }
    return list.slice(0, 80);
  }, [allBooks, bookQuery, courseBooksDraft]);

  const toggleTeacherId = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addBookToDraft = (bookId: string) => {
    setCourseBooksDraft((prev) => {
      if (prev.some((p) => p.bookId === bookId)) return prev;
      return [...prev, { bookId, isFree: false }];
    });
    setBookSearchOpen(false);
    setBookQuery('');
  };

  const updateSidebarFeature = (id: string, patch: Partial<CourseFormSidebarFeature>) => {
    setForm((f) => ({
      ...f,
      sidebarFeatures: f.sidebarFeatures.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };
  const addSidebarFeature = () => {
    setForm((f) => ({
      ...f,
      sidebarFeatures: [
        ...f.sidebarFeatures,
        { id: newPublicCourseSidebarFeatureId(), label: '', value: '', icon: '' },
      ],
    }));
  };
  const removeSidebarFeature = (id: string) => {
    setForm((f) => ({ ...f, sidebarFeatures: f.sidebarFeatures.filter((r) => r.id !== id) }));
  };

  const syncCourseBooksToServer = useCallback(async (courseId: string, draft: CourseFormBookLink[]) => {
    const res = await getCourseBooks(courseId);
    const existing = res.success && res.data ? res.data : [];
    for (const ex of existing) {
      if (!draft.some((d) => d.bookId === ex.bookId)) {
        await removeCourseBook(ex.id).catch(() => null);
      }
    }
    const res2 = await getCourseBooks(courseId);
    const after = res2.success && res2.data ? res2.data : [];
    for (const d of draft) {
      const ex = after.find((e) => e.bookId === d.bookId);
      if (!ex) await addCourseBook(courseId, d.bookId, d.isFree).catch(() => null);
      else if (ex.isFree !== d.isFree) await updateCourseBook(ex.id, d.isFree).catch(() => null);
    }
  }, []);

  const handleSave = async () => {
    const selectedProgram = programs.find((program) => program.id === form.programId);
    const isMonthlyProgram = selectedProgram?.paymentCircle === 'MONTHLY';

    if (!form.name.trim()) {
      setError('Course name is required');
      setActiveTab('basic');
      return;
    }
    if (!form.programId) {
      setError('Program is required');
      setActiveTab('basic');
      return;
    }
    if (form.branchAccessMode === 'SPECIFIC_BRANCH' && allowedBranchIds.length === 0) {
      setError('Select at least one branch when access is limited to selected branches.');
      setActiveTab('basic');
      return;
    }
    if (!form.fee || Number(form.fee) <= 0) {
      setError('Course fee is required');
      setActiveTab('pricing');
      return;
    }
    if (isMonthlyProgram && !form.startMonth) {
      setError('Start month is required for monthly courses');
      setActiveTab('basic');
      return;
    }
    if (isMonthlyProgram && (!form.durationMonths || Number(form.durationMonths) < 1)) {
      setError('Course duration is required for monthly courses');
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const benefits = form.benefitsText
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean);
      const sidebarPayload = form.sidebarFeatures
        .filter((f) => f.label.trim() || f.value.trim())
        .map((f) => ({
          id: f.id,
          label: f.label.trim(),
          value: f.value.trim(),
          ...(f.icon.trim() ? { icon: f.icon.trim() } : {}),
        }));

      const outlineExtra: Record<string, unknown> = {
        includePrintedBooks: form.includePrintedBooks || undefined,
        publicPageDisplay: {
          showBenefits: form.showBenefits,
          showWebsiteSections: form.showWebsiteSections,
          showBooks: form.showBooks,
          showSidebar: form.showSidebar,
          showTeachers: form.showTeachers,
        },
      };
      if (benefits.length) outlineExtra.benefits = benefits;
      if (sidebarPayload.length) outlineExtra.sidebarFeatures = sidebarPayload;
      if (form.sidebarTitle.trim()) outlineExtra.sidebarTitle = form.sidebarTitle.trim();

      const baseOutline =
        initial?.outline && typeof initial.outline === 'object' && !Array.isArray(initial.outline)
          ? { ...(initial.outline as Record<string, unknown>) }
          : {};
      const mergedOutline: Record<string, unknown> = { ...baseOutline, ...outlineExtra };
      const prevPP = baseOutline.publicPageDisplay;
      mergedOutline.publicPageDisplay = {
        ...(prevPP && typeof prevPP === 'object' && !Array.isArray(prevPP)
          ? { ...(prevPP as Record<string, unknown>) }
          : {}),
        ...(outlineExtra.publicPageDisplay as Record<string, unknown>),
      };
      if (!benefits.length) delete mergedOutline.benefits;
      if (!sidebarPayload.length) delete mergedOutline.sidebarFeatures;
      if (!form.sidebarTitle.trim()) delete mergedOutline.sidebarTitle;

      if (form.heroTitle.trim()) mergedOutline.heroTitle = form.heroTitle.trim();
      else delete mergedOutline.heroTitle;
      if (form.whyTakeTitle.trim()) mergedOutline.whyTakeTitle = form.whyTakeTitle.trim();
      else delete mergedOutline.whyTakeTitle;
      if (form.booksSectionTitle.trim()) mergedOutline.booksSectionTitle = form.booksSectionTitle.trim();
      else delete mergedOutline.booksSectionTitle;
      if (form.booksSectionSubtitle.trim()) mergedOutline.booksSectionSubtitle = form.booksSectionSubtitle.trim();
      else delete mergedOutline.booksSectionSubtitle;
      if (form.teachersSectionTitle.trim()) mergedOutline.teachersSectionTitle = form.teachersSectionTitle.trim();
      else delete mergedOutline.teachersSectionTitle;

      const dto: CreateCourseDto | UpdateCourseDto = {
        name: form.name.trim(),
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
        outline: mergedOutline as unknown as import('@/types/course').JsonValue,
      };

      if (thumbUseUrl) {
        (dto as import('@/types/course').UpdateCourseDto & { thumbnail?: string | null }).thumbnail =
          form.thumbnail.trim() || null;
      }

      const res = initial
        ? await updateCourse(initial.id, dto as UpdateCourseDto)
        : await createCourse(dto as CreateCourseDto);

      if (!res.success || !res.data) throw new Error((res as { message?: string }).message ?? 'Save failed');

      const courseId = res.data.id;
      const branchSync = await syncCourseBranches(
        courseId,
        form.branchAccessMode === 'SPECIFIC_BRANCH' ? allowedBranchIds : []
      );
      if (!branchSync.success) {
        throw new Error((branchSync as { message?: string }).message ?? 'Failed to sync branch access');
      }

      await syncCourseBooksToServer(courseId, courseBooksDraft);

      const targetIds = [...new Set(selectedTeacherIds)];
      const baseIds = initial ? [...new Set(initialTeacherIds)] : [];
      const toAdd = targetIds.filter((id) => !baseIds.includes(id));
      const toRemove = baseIds.filter((id) => !targetIds.includes(id));
      await Promise.all([
        ...toAdd.map((id) => addCourseTeacher(courseId, id).catch(() => null)),
        ...toRemove.map((id) => removeCourseTeacher(courseId, id).catch(() => null)),
      ]);

      let savedCourse = res.data;
      if (thumbUseFile && thumbFile) {
        const up = await uploadCourseThumbnail(courseId, thumbFile);
        if (up.success && up.data) savedCourse = up.data;
      }
      onSaved(savedCourse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1';
  const allowInteractionFromPortaledDropdown = (event: { preventDefault: () => void; target: EventTarget | null }) => {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest?.('[data-slot="popover-content"]') ||
      target?.closest?.('[data-slot="select-content"]')
    ) {
      event.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Overrides only; base DialogContent keeps positioning, motion, z-index, translate, etc.
          'bg-white p-0 gap-0 flex flex-col overflow-hidden rounded-xl border-slate-200 shadow-xl',
          'max-h-[92vh] w-full max-w-[calc(100%-1.5rem)] sm:max-w-5xl',
        )}
        onPointerDownOutside={allowInteractionFromPortaledDropdown}
        onInteractOutside={allowInteractionFromPortaledDropdown}
      >
        <DialogTitle className="sr-only">{initial ? 'Edit Course' : 'Create Course'}</DialogTitle>
        <DialogDescription className="sr-only">Course form</DialogDescription>

        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">{initial ? 'Edit Course' : 'Create Course'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{initial ? initial.name : 'Fill in the details below'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <TabsList className="h-auto min-h-10 w-full shrink-0 flex-wrap justify-start gap-1 rounded-none border-b border-slate-100 bg-white px-3 py-2 sm:px-4">
              {[
                { id: 'basic', label: 'Basic', icon: <Settings className="h-3.5 w-3.5" /> },
                { id: 'pricing', label: 'Pricing', icon: <GraduationCap className="h-3.5 w-3.5" /> },
                { id: 'page', label: 'Public page', icon: <Layers className="h-3.5 w-3.5" /> },
              ].map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-500 sm:px-3"
                >
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="basic" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <label className={labelCls}>
                    Course name <span className="text-slate-700">*</span>
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. HSC Physics Special Batch"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">URL slug is generated automatically on save.</p>
                </div>
                <div className="lg:col-span-4">
                  <label className={labelCls}>
                    Program <span className="text-slate-700">*</span>
                  </label>
                  <Select value={form.programId} onValueChange={(v) => set('programId', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-12 space-y-2">
                  <label className={labelCls}>Teachers</label>
                  <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal h-10 border-slate-200"
                      >
                        <span className="truncate text-left text-sm text-slate-700">
                          {selectedTeacherIds.length
                            ? `${selectedTeacherIds.length} selected`
                            : 'Search and add teachers…'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(100vw-2rem,32rem)] overflow-hidden rounded-xl border-slate-200 bg-white p-0 text-slate-900 shadow-xl" align="start">
                      <div className="p-2 border-b border-slate-100">
                        <Input
                          placeholder="Search by name or email…"
                          value={teacherQuery}
                          onChange={(e) => setTeacherQuery(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto overscroll-contain p-1 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
                        {filteredTeachers.length === 0 ? (
                          <p className="text-xs text-slate-400 p-2">No matches.</p>
                        ) : (
                          filteredTeachers.map((t) => {
                            const on = selectedTeacherIds.includes(t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => toggleTeacherId(t.id)}
                                className={cn(
                                  'w-full text-left rounded-md px-2 py-2 text-sm flex items-center gap-2 hover:bg-slate-50',
                                  on && 'bg-indigo-50'
                                )}
                              >
                                <span
                                  className={cn(
                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-black',
                                    on ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'
                                  )}
                                >
                                  {on ? '✓' : ''}
                                </span>
                                <span className="min-w-0">
                                  <span className="font-semibold text-slate-800 block truncate">{t.fullName}</span>
                                  {t.email ? (
                                    <span className="text-[11px] text-slate-400 truncate block">{t.email}</span>
                                  ) : null}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedTeacherIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTeacherIds.map((id) => {
                        const t = teachers.find((u) => u.id === id);
                        if (!t) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 pl-2.5 pr-1 py-0.5 text-xs font-medium text-slate-800"
                          >
                            <span className="max-w-[200px] truncate">{t.fullName}</span>
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-slate-300/80 text-slate-500 hover:text-slate-800"
                              onClick={() => setSelectedTeacherIds((p) => p.filter((x) => x !== id))}
                              aria-label={`Remove ${t.fullName}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="lg:col-span-12 space-y-2">
                  <label className={labelCls}>Recommended books</label>
                  <Popover open={bookSearchOpen} onOpenChange={setBookSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal h-10 border-slate-200"
                      >
                        <span className="truncate text-left text-sm text-slate-700">
                          {courseBooksDraft.length
                            ? `${courseBooksDraft.length} book(s) linked`
                            : 'Search and add books…'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(100vw-2rem,36rem)] overflow-hidden rounded-xl border-slate-200 bg-white p-0 text-slate-900 shadow-xl" align="start">
                      <div className="p-2 border-b border-slate-100">
                        <Input
                          placeholder="Search books…"
                          value={bookQuery}
                          onChange={(e) => setBookQuery(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto overscroll-contain p-1 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
                        {filteredBooksForPick.length === 0 ? (
                          <p className="text-xs text-slate-400 p-2">No books to add.</p>
                        ) : (
                          filteredBooksForPick.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => addBookToDraft(b.id)}
                              className="w-full text-left rounded-md px-2 py-2 text-sm hover:bg-slate-50 flex justify-between gap-2"
                            >
                              <span className="font-medium text-slate-800 truncate">{b.name}</span>
                              <span className="text-xs font-bold text-slate-500 shrink-0">৳{Number(b.price).toLocaleString()}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {courseBooksDraft.length > 0 ? (
                    <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
                      {courseBooksDraft.map((row) => {
                        const b = bookById.get(row.bookId);
                        return (
                          <div key={row.bookId} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                            <span className="font-medium text-slate-800 flex-1 min-w-[140px] truncate">
                              {b?.name ?? row.bookId}
                            </span>
                            <span className="text-xs font-bold text-slate-500 tabular-nums">
                              ৳{Number(b?.price ?? 0).toLocaleString()}
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                                checked={row.isFree}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setCourseBooksDraft((prev) =>
                                    prev.map((r) => (r.bookId === row.bookId ? { ...r, isFree: v } : r))
                                  );
                                }}
                              />
                              Free
                            </label>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-rose-600 p-1"
                              onClick={() => setCourseBooksDraft((prev) => prev.filter((r) => r.bookId !== row.bookId))}
                              aria-label="Remove book"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="lg:col-span-3">
                  <label className={labelCls}>Grade</label>
                  <Select value={form.grade || '_none'} onValueChange={(v) => set('grade', v === '_none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— None —</SelectItem>
                      {['SSC', 'HSC', 'Admission', 'Junior', 'Cadet', 'Job'].map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="lg:col-span-3">
                  <label className={labelCls}>Group</label>
                  <Select value={form.group || '_none'} onValueChange={(v) => set('group', v === '_none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— None —</SelectItem>
                      {['Science', 'Commerce', 'Arts', 'General'].map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="lg:col-span-3">
                  <label className={labelCls}>Type</label>
                  <div className="flex gap-2">
                    {(['ONLINE', 'OFFLINE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('type', t)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                          form.type === t
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                            : 'bg-white text-slate-500 border-slate-200'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <label className={labelCls}>Status</label>
                  <Select value={form.status} onValueChange={(v) => set('status', v as CourseForm['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DISABLED">Disabled</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-4">
                  <label className={labelCls}>Admission</label>
                  <div className="flex gap-2">
                    {(['OPEN', 'CLOSED'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('admissionStatus', s)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                          form.admissionStatus === s
                            ? s === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                              : 'bg-slate-100 text-slate-700 border-slate-400'
                            : 'bg-white text-slate-500 border-slate-200'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-4">
                  <label className={labelCls}>Start month</label>
                  <Input type="month" value={form.startMonth} onChange={(e) => set('startMonth', e.target.value)} />
                </div>
                <div className="lg:col-span-4">
                  <label className={labelCls}>Duration (months)</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.durationMonths}
                    onChange={(e) => set('durationMonths', e.target.value)}
                    placeholder="12"
                  />
                </div>

                <div className="lg:col-span-6">
                  <label className={labelCls}>Branch access</label>
                  <Select value={form.branchAccessMode} onValueChange={(v) => set('branchAccessMode', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_BRANCH">All branches</SelectItem>
                      <SelectItem value="SPECIFIC_BRANCH">Selected branches only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.branchAccessMode === 'SPECIFIC_BRANCH' ? (
                  <div className="lg:col-span-12">
                    <label className={labelCls}>Branches with access</label>
                    <BranchMultiSelect
                      branches={allBranches}
                      value={allowedBranchIds}
                      onChange={setAllowedBranchIds}
                      disabled={saving}
                    />
                  </div>
                ) : null}

                <div className="lg:col-span-12">
                  <label className={labelCls}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    placeholder="Short description (HTML allowed on public page)…"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
                  />
                </div>

                <div className="lg:col-span-12">
                  <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/90 p-5 sm:p-6 shadow-sm">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Course thumbnail
                        </Label>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                          Shown in the course catalog and on the public page. Add a 16:9 or wide image for best
                          results.
                        </p>
                      </div>
                    </div>

                    <Tabs value={thumbTab} onValueChange={onThumbTabChange} className="w-full">
                      <TabsList className="grid h-12 w-full grid-cols-3 gap-0 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1.5 sm:h-11 sm:max-w-2xl">
                        <TabsTrigger
                          value="none"
                          className="cursor-pointer gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                          <ImageOff className="h-3.5 w-3.5 opacity-60" />
                          <span className="hidden sm:inline">No change</span>
                          <span className="sm:hidden">None</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="url"
                          className="cursor-pointer gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                          <Link2 className="h-3.5 w-3.5 opacity-70" />
                          Link
                        </TabsTrigger>
                        <TabsTrigger
                          value="file"
                          className="cursor-pointer gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                          <Upload className="h-3.5 w-3.5 opacity-70" />
                          Upload
                        </TabsTrigger>
                      </TabsList>

                      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(220px,280px)] lg:items-stretch">
                        <div className="min-w-0 space-y-0">
                          <TabsContent value="none" className="mt-0 min-h-[120px] max-w-xl">
                            <div className="flex gap-3 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-600">
                              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                              <p className="pt-0.5 leading-relaxed">
                                {initial?.id
                                  ? 'Saves the course without changing the stored thumbnail. Switch to Link or Upload if you need to replace it.'
                                  : 'No custom image. You can set one later in Link or Upload.'}
                              </p>
                            </div>
                          </TabsContent>

                          <TabsContent value="url" className="mt-0 max-w-2xl space-y-2">
                            <Label htmlFor="course-thumb-url" className="text-xs text-slate-600">
                              Image URL or path
                            </Label>
                            <Input
                              id="course-thumb-url"
                              value={form.thumbnail}
                              onChange={(e) => set('thumbnail', e.target.value)}
                              autoComplete="off"
                              placeholder="https://… or /uploads/…"
                              className="h-10 text-sm"
                            />
                            <p className="text-[11px] text-slate-500">
                              Leave the field empty when saving to remove the current thumbnail. Supports HTTPS links and
                              site paths.
                            </p>
                          </TabsContent>

                          <TabsContent value="file" className="mt-0 max-w-2xl space-y-3">
                            <input
                              ref={thumbFileInputRef}
                              id="course-thumb-file"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                e.target.value = '';
                                pickThumbFile(f);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => thumbFileInputRef.current?.click()}
                              onDragOver={(e) => handleThumbDrag(e, true)}
                              onDragLeave={(e) => handleThumbDrag(e, false)}
                              onDrop={handleThumbDrop}
                              className={cn(
                                'group w-full cursor-pointer rounded-xl border-2 border-dashed text-left transition-all outline-none',
                                thumbDropActive
                                  ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200/80'
                                  : 'border-slate-200/90 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50/80',
                                'focus-visible:ring-2 focus-visible:ring-indigo-300/80'
                              )}
                            >
                              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 sm:py-10">
                                <div
                                  className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                                    thumbDropActive ? 'bg-indigo-200/50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
                                  )}
                                >
                                  <Upload className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-semibold text-slate-800">Drop an image here</p>
                                <p className="text-center text-xs text-slate-500">or click to choose · PNG, JPG, WebP</p>
                                {thumbFile ? (
                                  <p className="mt-1 max-w-full truncate rounded-md bg-white/80 px-2 py-0.5 text-center text-xs font-medium text-slate-700">
                                    {thumbFile.name}
                                  </p>
                                ) : null}
                                <div className="pt-1">
                                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                                    Browse files
                                  </span>
                                </div>
                              </div>
                            </button>
                            {thumbFile ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  setThumbFile(null);
                                  if (thumbFileInputRef.current) thumbFileInputRef.current.value = '';
                                }}
                              >
                                Remove file
                              </Button>
                            ) : null}
                          </TabsContent>
                        </div>

                        <div className="flex min-h-0 flex-col gap-2 lg:pl-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview</span>
                          <div
                            className={cn(
                              'relative w-full flex-1 overflow-hidden rounded-2xl border-2',
                              previewSrc
                                ? 'border-slate-200 bg-slate-100'
                                : 'border-dashed border-slate-200/80 bg-slate-50/60',
                              'min-h-[140px] aspect-[16/9] max-h-[200px] lg:max-h-none'
                            )}
                          >
                            {thumbTab === 'none' && initial?.thumbnail?.trim() && previewSrc && !urlPreviewError && (
                              <span className="absolute right-2 top-2 z-10 rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
                                Current
                              </span>
                            )}
                            {previewSrc && !urlPreviewError ? (
                              <img
                                src={previewSrc}
                                alt=""
                                className="h-full w-full object-cover"
                                onLoad={() => setUrlPreviewError(false)}
                                onError={() => setUrlPreviewError(true)}
                              />
                            ) : null}
                            {previewSrc && urlPreviewError && thumbUseUrl ? (
                              <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-slate-100/95 p-3 text-center">
                                <ImageOff className="h-9 w-9 text-rose-300" />
                                <p className="text-xs text-slate-500">This URL did not load. Check the address.</p>
                              </div>
                            ) : null}
                            {!previewSrc ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200/50 text-slate-300">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-slate-400">Preview appears here</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Tabs>
                  </div>
                </div>

                <div className="lg:col-span-12 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => set('settledOptionEnabled', !form.settledOptionEnabled)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0',
                      form.settledOptionEnabled ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'
                    )}
                  >
                    {form.settledOptionEnabled && <span className="text-white text-[10px] font-black">✓</span>}
                  </button>
                  <label
                    className="text-sm text-slate-700 font-medium cursor-pointer"
                    onClick={() => set('settledOptionEnabled', !form.settledOptionEnabled)}
                  >
                    Enable settle option for this course
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Course fee (৳) *</label>
                  <Input type="number" min={0} value={form.fee} onChange={(e) => set('fee', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Offer price (৳)</label>
                  <Input type="number" min={0} value={form.offerPrice} onChange={(e) => set('offerPrice', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Book / material (৳)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bookPrice}
                    onChange={(e) => {
                      if (courseBooksDraft.length === 0) set('bookPrice', e.target.value);
                    }}
                    readOnly={courseBooksDraft.length > 0}
                    className={cn(courseBooksDraft.length > 0 && 'bg-slate-50 text-slate-700')}
                  />
                  {courseBooksDraft.length > 0 ? (
                    <p className="text-[10px] text-slate-500 mt-1">Sum of non-free linked book prices.</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">Link books on Basic tab to auto-fill, or enter manually.</p>
                  )}
                </div>
              </div>
              {discountPct > 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="text-2xl font-black text-emerald-600">{discountPct}% off</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">৳{offer.toLocaleString()} effective</p>
                    <p className="text-xs text-emerald-600">Save ৳{(fee - offer).toLocaleString()} vs fee</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => set('includePrintedBooks', !form.includePrintedBooks)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0',
                    form.includePrintedBooks ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'
                  )}
                >
                  {form.includePrintedBooks && <span className="text-white text-[10px] font-black">✓</span>}
                </button>
                <label
                  className="text-sm text-slate-700 font-medium cursor-pointer"
                  onClick={() => set('includePrintedBooks', !form.includePrintedBooks)}
                >
                  Include printed books in course fee
                </label>
              </div>
            </TabsContent>

            <TabsContent value="page" className="mt-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Catalog & enrollment</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    {
                      key: 'featured' as const,
                      label: 'Featured',
                      title:
                        'When on, this course can appear in the home page Featured section (only active, public-catalog courses).',
                      icon: <Star className="h-4 w-4 text-amber-500" />,
                    },
                    {
                      key: 'websiteVisible' as const,
                      label: 'Public catalog',
                      title:
                        'When off, hides the course from the public website (All Courses, course links). Admin and assigned staff still manage it; enrolled students keep access.',
                      icon: <Eye className="h-4 w-4 text-slate-600" />,
                    },
                    {
                      key: 'enrollmentVisible' as const,
                      label: 'Enrollment',
                      title: 'Controls visibility for enrollment flows where this flag is honored.',
                      icon: <DoorOpen className="h-4 w-4 text-emerald-600" />,
                    },
                  ]).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      title={item.title}
                      onClick={() => set(item.key, !form[item.key])}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors cursor-pointer',
                        form[item.key]
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {item.icon}
                      {item.label}
                      <span className="text-[10px] font-black opacity-70">{form[item.key] ? 'ON' : 'OFF'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Public page blocks</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'showBenefits' as const, label: 'Benefits' },
                    { key: 'showWebsiteSections' as const, label: 'HTML sections' },
                    { key: 'showBooks' as const, label: 'Books' },
                    { key: 'showTeachers' as const, label: 'Teachers', icon: <Users className="h-3.5 w-3.5" /> },
                    { key: 'showSidebar' as const, label: 'Sidebar' },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => set(item.key, !form[item.key])}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors cursor-pointer',
                        form[item.key]
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {'icon' in item ? item.icon : null}
                      {item.label}
                      <span className="text-[10px] font-black opacity-70">{form[item.key] ? 'ON' : 'OFF'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Hero title override</label>
                  <Input
                    value={form.heroTitle}
                    onChange={(e) => set('heroTitle', e.target.value)}
                    placeholder="Blank = course name"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className={labelCls}>Benefits block title</label>
                  <Input
                    value={form.whyTakeTitle}
                    onChange={(e) => set('whyTakeTitle', e.target.value)}
                    placeholder="কোর্সটি কেন করবেন?"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Benefit bullets (one per line)</label>
                <textarea
                  value={form.benefitsText}
                  onChange={(e) => set('benefitsText', e.target.value)}
                  rows={5}
                  placeholder="One line per bullet"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Books section title</label>
                  <Input
                    value={form.booksSectionTitle}
                    onChange={(e) => set('booksSectionTitle', e.target.value)}
                    placeholder="সুপারিশকৃত বই"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className={labelCls}>Books section subtitle</label>
                  <Input
                    value={form.booksSectionSubtitle}
                    onChange={(e) => set('booksSectionSubtitle', e.target.value)}
                    placeholder="Optional"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Teachers section title</label>
                  <Input
                    value={form.teachersSectionTitle}
                    onChange={(e) => set('teachersSectionTitle', e.target.value)}
                    placeholder="কোর্সের শিক্ষক"
                    className="h-9 text-sm max-w-md"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sidebar features</span>
                <div>
                  <label className={labelCls}>Card title</label>
                  <Input
                    value={form.sidebarTitle}
                    onChange={(e) => set('sidebarTitle', e.target.value)}
                    placeholder="কোর্স ফিচারসমূহ"
                    className="h-9 text-sm max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  {form.sidebarFeatures.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap gap-2 items-end border border-slate-100 rounded-md p-2 bg-slate-50/60"
                    >
                      <div className="min-w-[120px] flex-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Label</label>
                        <Input
                          value={row.label}
                          onChange={(e) => updateSidebarFeature(row.id, { label: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="min-w-[120px] flex-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Value</label>
                        <Input
                          value={row.value}
                          onChange={(e) => updateSidebarFeature(row.id, { value: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="shrink-0 w-11">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Icon</label>
                        <Popover
                          open={sidebarIconPickerId === row.id}
                          onOpenChange={(isOpen) => setSidebarIconPickerId(isOpen ? row.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 w-full min-w-0 px-0 text-lg leading-none font-normal border-slate-200 hover:bg-slate-50"
                              aria-label="Choose emoji icon"
                            >
                              <span className="truncate max-w-8 block">{row.icon.trim() ? row.icon : '✦'}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 border-0 shadow-lg z-[60]"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            <EmojiPicker
                              width={300}
                              height={340}
                              skinTonesDisabled
                              previewConfig={{ showPreview: false }}
                              onEmojiClick={(emojiData: EmojiClickData) => {
                                updateSidebarFeature(row.id, { icon: emojiData.emoji });
                                setSidebarIconPickerId(null);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSidebarFeature(row.id)}
                        className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8" onClick={addSidebarFeature}>
                  <Plus className="h-3.5 w-3.5" /> Row
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <p className={cn('text-xs font-semibold', error ? 'text-destructive' : 'invisible')}>{error || 'ok'}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="text-white bg-black hover:bg-black/90">
              {saving ? 'Saving…' : initial ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
