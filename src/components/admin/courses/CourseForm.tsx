'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  createCourse,
  updateCourse,
  getCourses,
  getCourseContents,
  deleteCourseContent,
  getAssociatedCourses,
  deleteAssociatedCourse,
  uploadCourseThumbnail,
  updateCourseContent,
} from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import {
  AdmissionStatus,
  CourseStatus,
  CourseType,
  CreateCourseDto,
  UpdateCourseDto,
  Program,
  CourseDetails,
  type CourseWebsiteSection,
  type JsonValue,
  DEFAULT_PUBLIC_CURRICULUM_TYPES,
  PUBLIC_CURRICULUM_CONTENT_TYPES,
  newCourseWebsiteSectionId,
  curriculumContentTypeLabel,
  normalizeCoursePublicPageDisplay,
  normalizeCourseWebsiteSections,
} from '@/types/course';
import type { ContentType } from '@/types/course-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { uploadQuestionImage } from '@/lib/api/question-bank';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Info,
  FileUp,
  Link2,
  Plus,
  Trash2,
  FileText,
  Video,
  FileCheck,
  Eye,
  Upload,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Play,
  Clock,
  Pencil,
  GripVertical,
  Star,
  Globe,
  Users,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseResourceForm } from './CourseResourceForm';
import { CourseAssociationForm } from './CourseAssociationForm';
import {
  Dialog as SimpleDialog,
  DialogContent as SimpleDialogContent,
  DialogHeader as SimpleDialogHeader,
  DialogTitle as SimpleDialogTitle,
  DialogFooter as SimpleDialogFooter,
} from '@/components/ui/dialog';

/* ─── types ─────────────────────────────────────────────────────────────────── */
const statusOptions: CourseStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: CourseType[] = ['ONLINE', 'OFFLINE'];


function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const DEFAULT_BENEFITS = [
  'অভিজ্ঞ শিক্ষক মন্ডলী',
  'মানসম্মত লেকচার শিট',
  'নিয়মিত মডেল টেস্ট',
  'সাপ্তাহিক সলভ ক্লাস',
];

type FormState = {
  programId: string;
  name: string;
  slug: string;
  thumbnail: string;
  type: CourseType;
  fee: string;
  description: string;
  status: CourseStatus;
  admissionStatus: AdmissionStatus;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  settledOptionEnabled: boolean;
  benefits: string[];
  websiteSections: CourseWebsiteSection[];
  publicShowBenefits: boolean;
  publicShowWebsiteSections: boolean;
  publicShowBooks: boolean;
  publicShowCurriculum: boolean;
  publicCurriculumTypes: ContentType[];
};

const defaultForm: FormState = {
  programId: '',
  name: '',
  slug: '',
  thumbnail: '',
  type: 'ONLINE',
  fee: '0',
  description: '',
  status: 'ACTIVE',
  admissionStatus: 'OPEN',
  featured: false,
  websiteVisible: true,
  enrollmentVisible: true,
  settledOptionEnabled: false,
  benefits: DEFAULT_BENEFITS,
  websiteSections: [],
  publicShowBenefits: true,
  publicShowWebsiteSections: true,
  publicShowBooks: true,
  publicShowCurriculum: true,
  publicCurriculumTypes: [...DEFAULT_PUBLIC_CURRICULUM_TYPES],
};

interface CourseFormProps {
  programs: Program[];
  course?: CourseDetails | null;
  onSuccess: () => Promise<void>;
}

/* ─── shared style tokens ────────────────────────────────────────────────────── */
const field =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all';

const SectionCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
      className,
    )}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{children}</p>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
    {children}
    {required && <span className="ml-1 text-rose-400">*</span>}
  </label>
);

/* ─── toggle checkbox ─────────────────────────────────────────────────────────── */
const Toggle = ({
  checked,
  onChange,
  label,
  description,
  accent = 'indigo',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  accent?: 'indigo' | 'rose' | 'emerald';
}) => {
  const ring =
    accent === 'rose'
      ? 'bg-rose-500'
      : accent === 'emerald'
        ? 'bg-emerald-500'
        : 'bg-indigo-500';
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-left transition-colors hover:bg-white hover:border-slate-200"
    >
      <div
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? ring : 'bg-slate-200',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        {description && <p className="mt-0.5 text-[10px] text-slate-400">{description}</p>}
      </div>
    </button>
  );
};

/* ─── main component ─────────────────────────────────────────────────────────── */
export function CourseForm({ programs, course, onSuccess }: CourseFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'related'>('basic');
  const [resources, setResources] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [addingToChapter, setAddingToChapter] = useState<string | null>(null);
  const [addingChapterOrder, setAddingChapterOrder] = useState<number | null>(null);
  const [addingSubjectTitle, setAddingSubjectTitle] = useState<string | null>(null);
  const [subjectRenaming, setSubjectRenaming] = useState(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean; subject: string }>({
    open: false,
    subject: '',
  });
  const [renameInput, setRenameInput] = useState('');

  const isEdit = !!course;



  const fetchExtras = async () => {
    if (!course?.id) return;
    try {
      const [resRes, assocRes, coursesRes] = await Promise.all([
        getCourseContents({ courseId: course.id }),
        getAssociatedCourses({ fromCourseId: course.id }),
        getCourses({}),
      ]);
      if (resRes.success) setResources(resRes.data || []);
      if (assocRes.success) setAssociations(assocRes.data || []);
      if (coursesRes.success) setAllCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (course) {
      const outlineData = course.outline as any;
      const loadedBenefits =
        Array.isArray(outlineData?.benefits) && outlineData.benefits.length > 0
          ? outlineData.benefits
          : DEFAULT_BENEFITS;
      const loadedWebsiteSections = normalizeCourseWebsiteSections(outlineData?.websiteSections);
      const pub = normalizeCoursePublicPageDisplay(course.outline);
      setForm({
        programId: course.programId,
        name: course.name,
        slug: course.slug,
        thumbnail: course.thumbnail || '',
        type: course.type,
        fee: String(course.fee),
        description: course.description || '',
        status: course.status,
        admissionStatus: course.admissionStatus,
        featured: course.featured,
        websiteVisible: course.websiteVisible,
        enrollmentVisible: course.enrollmentVisible !== false,
        settledOptionEnabled: course.settledOptionEnabled,
        benefits: loadedBenefits,
        websiteSections: loadedWebsiteSections,
        publicShowBenefits: pub.showBenefits,
        publicShowWebsiteSections: pub.showWebsiteSections,
        publicShowBooks: pub.showBooks,
        publicShowCurriculum: pub.showCurriculum,
        publicCurriculumTypes: [...pub.curriculumContentTypes],
      });
      if (course.thumbnail) {
        setThumbnailPreview(resolveAttachmentUrl(course.thumbnail, API_ORIGIN));
      }
      fetchExtras();
    }
  }, [course]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setThumbnailPreview(localUrl);
    if (isEdit && course) {
      try {
        setThumbnailUploading(true);
        const res = await uploadCourseThumbnail(course.id, file);
        if (res.success && res.data?.thumbnail) {
          const stored = res.data.thumbnail;
          setForm((prev) => ({ ...prev, thumbnail: stored }));
          setThumbnailPreview(resolveAttachmentUrl(stored, API_ORIGIN));
          toast({ title: 'Thumbnail uploaded', variant: 'success' });
        }
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
        setThumbnailPreview(
          form.thumbnail ? resolveAttachmentUrl(form.thumbnail, API_ORIGIN) : null,
        );
      } finally {
        setThumbnailUploading(false);
      }
    } else {
      setForm((prev) => ({ ...prev, thumbnail: '' }));
      (handleThumbnailUpload as any).__pendingFile = file;
    }
  };

  const isSubjectOpen = (k: string) => expandedSubjects[k] === true;
  const toggleSubject = (k: string) =>
    setExpandedSubjects((prev) => ({ ...prev, [k]: !isSubjectOpen(k) }));
  const isChapterOpen = (k: string) => expandedChapters[k] === true;
  const toggleChapter = (k: string) =>
    setExpandedChapters((prev) => ({ ...prev, [k]: !isChapterOpen(k) }));

  const startRename = (subject: string) => {
    setRenameInput(subject === 'General' ? '' : subject);
    setRenameModal({ open: true, subject });
  };

  const submitRename = async () => {
    const oldKey = renameModal.subject === 'General' ? '' : renameModal.subject;
    const trimmed = renameInput.trim();
    if (trimmed === oldKey.trim()) {
      setRenameModal({ open: false, subject: '' });
      return;
    }
    try {
      setSubjectRenaming(true);
      const targets = resources.filter((r) => (r.subjectTitle || '').trim() === oldKey);
      await Promise.all(
        targets.map((r) => {
          const fd = new FormData();
          fd.append('subjectTitle', trimmed);
          return updateCourseContent(r.id, fd);
        }),
      );
      toast({ title: 'Subject renamed', variant: 'success' });
      await fetchExtras();
    } catch (err) {
      toast({ title: 'Rename failed', variant: 'destructive' });
    } finally {
      setSubjectRenaming(false);
      setRenameModal({ open: false, subject: '' });
    }
  };

  const contentBySubject = useMemo(() => {
    const chapters = resources.reduce<Record<string, typeof resources>>((acc, res) => {
      const subject = (res.subjectTitle || '').trim() || 'General';
      const chapter =
        (res.chapterTitle || '').trim() || (res.topicTitle || '').trim() || 'Ungrouped';
      const key = `${subject}:::${chapter}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(res);
      return acc;
    }, {});

    const sortedChapters = Object.entries(chapters).sort(([, a], [, b]) => {
      const aOrder = a[0]?.topicSortOrder ?? 999;
      const bOrder = b[0]?.topicSortOrder ?? 999;
      const subA = (a[0]?.subjectTitle || '').trim() || 'General';
      const subB = (b[0]?.subjectTitle || '').trim() || 'General';
      const subCmp = subA.localeCompare(subB);
      return subCmp !== 0 ? subCmp : aOrder - bOrder;
    });

    const subjectGroups = new Map<string, [string, typeof resources][]>();
    for (const row of sortedChapters) {
      const subjectPart = row[0].split(':::')[0] || 'General';
      if (!subjectGroups.has(subjectPart)) subjectGroups.set(subjectPart, []);
      subjectGroups.get(subjectPart)!.push(row);
    }
    const orderedSubjects = [...subjectGroups.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    return { sortedChapters, orderedSubjects };
  }, [resources]);

  const togglePublicCurriculumType = (t: ContentType) => {
    setForm((prev) => {
      const has = prev.publicCurriculumTypes.includes(t);
      if (has && prev.publicCurriculumTypes.length <= 1) {
        toast({ title: 'At least one type required', variant: 'destructive' });
        return prev;
      }
      return {
        ...prev,
        publicCurriculumTypes: has
          ? prev.publicCurriculumTypes.filter((x) => x !== t)
          : [...prev.publicCurriculumTypes, t],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.programId || !form.name.trim()) {
      setError('Program and course name are required.');
      return;
    }
    const filteredBenefits = form.benefits.map((b) => b.trim()).filter(Boolean);
    const existingOutline =
      course?.outline && typeof course.outline === 'object' && !Array.isArray(course.outline)
        ? (course.outline as Record<string, unknown>)
        : {};
    const websiteSectionsPayload = form.websiteSections
      .map((s) => ({
        id: (s.id && String(s.id).trim()) || newCourseWebsiteSectionId(),
        title: s.title.trim(),
        bodyHtml: s.bodyHtml.trim(),
      }))
      .filter((s) => s.title || s.bodyHtml);

    const outline: Record<string, unknown> = { ...existingOutline, benefits: filteredBenefits };
    if (websiteSectionsPayload.length > 0) {
      outline.websiteSections = websiteSectionsPayload;
    } else {
      delete outline.websiteSections;
    }
    if (form.publicShowCurriculum && form.publicCurriculumTypes.length === 0) {
      setError('Select at least one curriculum content type.');
      return;
    }
    outline.publicPageDisplay = {
      showBenefits: form.publicShowBenefits,
      showWebsiteSections: form.publicShowWebsiteSections,
      showBooks: form.publicShowBooks,
      showCurriculum: form.publicShowCurriculum,
      curriculumContentTypes:
        form.publicCurriculumTypes.length > 0
          ? form.publicCurriculumTypes
          : [...DEFAULT_PUBLIC_CURRICULUM_TYPES],
    };

    const payload: CreateCourseDto | UpdateCourseDto = {
      programId: form.programId,
      name: form.name.trim(),
      thumbnail: form.thumbnail.trim() || undefined,
      type: form.type,
      fee: Number(form.fee ?? 0),
      outline: outline as JsonValue,
      description: form.description.trim() || undefined,
      status: form.status,
      admissionStatus: form.admissionStatus,
      featured: form.featured,
      websiteVisible: form.websiteVisible,
      enrollmentVisible: form.enrollmentVisible,
      settledOptionEnabled: form.settledOptionEnabled,
    };

    try {
      setSubmitting(true);
      setError(null);
      if (isEdit && course) {
        await updateCourse(course.id, payload as UpdateCourseDto);
      } else {
        const res = await createCourse(payload as CreateCourseDto);
        if (res.success && res.data) {
          const pendingFile = (handleThumbnailUpload as any).__pendingFile as File | undefined;
          if (pendingFile && res.data.id) {
            try {
              await uploadCourseThumbnail(res.data.id, pendingFile);
            } catch {}
            (handleThumbnailUpload as any).__pendingFile = undefined;
          }
          toast({ title: 'Course created successfully', variant: 'success' });
          closeModal();
          await onSuccess();
          return;
        }
      }
      toast({ title: isEdit ? 'Changes saved' : 'Course created', variant: 'success' });
      closeModal();
      await onSuccess();
    } catch (err: any) {
      const msg = err.message || `Failed to ${isEdit ? 'update' : 'create'} course`;
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-3.5 w-3.5" />;
      case 'SYLLABUS':
        return <FileCheck className="h-3.5 w-3.5" />;
      case 'LEAFLET':
        return <Eye className="h-3.5 w-3.5" />;
      case 'SCHEDULE':
        return <Calendar className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  /* ─────────────────────────────────── TABS ─────────────────────────────────── */
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'content', label: 'Course Content', icon: FileUp, disabled: !isEdit },
    { id: 'related', label: 'Related Courses', icon: Link2, disabled: !isEdit },
  ] as const;

  return (
    <div className="flex flex-col h-[88vh] bg-[#f8f8fa] text-slate-900 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Course' : 'Create New Course'}
            </h2>
            {isEdit && (
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{course?.name}</p>
            )}
          </div>
          {isEdit && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1',
                course?.status === 'ACTIVE'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : course?.status === 'DISABLED'
                    ? 'border-amber-200 bg-amber-50 text-amber-600'
                    : 'border-slate-200 bg-slate-50 text-slate-500',
              )}
            >
              {course?.status}
            </Badge>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-all border-b-2',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
                tab.disabled && 'opacity-30 cursor-not-allowed pointer-events-none',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-5">

        {/* ══════════════════════════════ BASIC INFO ══════════════════════════ */}
        {activeTab === 'basic' && (
          <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-200">

            {/* ── Program & Identity ── */}
            <SectionCard>
              <SectionTitle>Course Identity</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel required>Program</FieldLabel>
                  <Select
                    value={form.programId}
                    onValueChange={(v) => setForm((p) => ({ ...p, programId: v }))}
                  >
                    <SelectTrigger className={field}>
                      <SelectValue placeholder="Select a program…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-sm font-medium">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel required>Course Title</FieldLabel>
                  <Input
                    className={field}
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((p) => ({ ...p, name, slug: buildSlug(name) }));
                    }}
                    placeholder="e.g. HSC Physics Complete Batch 2025"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel>URL Slug</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none">
                      /course/
                    </span>
                    <Input
                      className={cn(field, 'pl-[72px] bg-slate-50 text-slate-500 cursor-default')}
                      value={form.slug}
                      readOnly
                      placeholder="auto-generated"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Thumbnail ── */}
            <SectionCard>
              <SectionTitle>Thumbnail</SectionTitle>
              <div className="flex items-start gap-4">
                {thumbnailPreview && (
                  <div className="relative shrink-0 group">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-24 w-40 rounded-xl border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview(null);
                        setForm((p) => ({ ...p, thumbnail: '' }));
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 px-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/30',
                      thumbnailUploading && 'opacity-50 pointer-events-none',
                    )}
                  >
                    {thumbnailUploading ? (
                      <p className="text-sm font-semibold text-indigo-500 animate-pulse">
                        Uploading…
                      </p>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-500">
                          {thumbnailPreview ? 'Replace thumbnail' : 'Upload thumbnail'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Any image format · Max 5 MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailUpload}
                    disabled={thumbnailUploading}
                  />
                </label>
              </div>
            </SectionCard>

            {/* ── Pricing & Type ── */}
            <SectionCard>
              <SectionTitle>Pricing & Configuration</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel>Course Type</FieldLabel>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((p) => ({ ...p, type: v as CourseType }))}
                  >
                    <SelectTrigger className={field}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {typeOptions.map((o) => (
                        <SelectItem key={o} value={o} className="text-sm font-medium">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Tuition Fee (BDT)</FieldLabel>
                  <Input
                    className={field}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.fee}
                    onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((p) => ({ ...p, status: v as CourseStatus }))}
                  >
                    <SelectTrigger className={field}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {statusOptions.map((o) => (
                        <SelectItem key={o} value={o} className="text-sm font-medium">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Admission Status</FieldLabel>
                  <Select
                    value={form.admissionStatus}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, admissionStatus: v as AdmissionStatus }))
                    }
                  >
                    <SelectTrigger className={field}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {(['OPEN', 'CLOSED'] as AdmissionStatus[]).map((o) => (
                        <SelectItem key={o} value={o} className="text-sm font-medium">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </SectionCard>

            {/* ── Visibility toggles ── */}
            <SectionCard>
              <SectionTitle>Visibility & Access</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2">
                <Toggle
                  checked={form.featured}
                  onChange={(v) => setForm((p) => ({ ...p, featured: v }))}
                  label="Featured course"
                  description="Shown prominently on listings"
                />
                <Toggle
                  checked={form.websiteVisible}
                  onChange={(v) => setForm((p) => ({ ...p, websiteVisible: v }))}
                  label="Visible on website"
                  description="Public can see this course"
                />
                <Toggle
                  checked={form.enrollmentVisible}
                  onChange={(v) => setForm((p) => ({ ...p, enrollmentVisible: v }))}
                  label="Show enrollment count"
                  description="Display number of enrolled students"
                />
                <Toggle
                  checked={form.settledOptionEnabled}
                  onChange={(v) => setForm((p) => ({ ...p, settledOptionEnabled: v }))}
                  label="Enable settle option"
                  description="Admin can mark all dues paid, cancel enrollments"
                  accent="rose"
                />
              </div>
            </SectionCard>

            {/* ── Description ── */}
            <SectionCard>
              <SectionTitle>Course Overview</SectionTitle>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                onImageUpload={async (file) => {
                  const res = await uploadQuestionImage(file);
                  return res.data?.url || '';
                }}
                placeholder="Describe the course curriculum, goals, and target audience…"
                className="min-h-[180px]"
              />
            </SectionCard>

            {/* ── Benefits ── */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>কোর্সের সুবিধাসমূহ</SectionTitle>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      benefits: [...p.benefits, ''],
                    }))
                  }
                  disabled={form.benefits.length >= 12}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-indigo-700 disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {form.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center text-[10px] font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <Input
                      className={cn(field, 'flex-1')}
                      value={benefit}
                      onChange={(e) => {
                        const next = [...form.benefits];
                        next[idx] = e.target.value;
                        setForm((p) => ({ ...p, benefits: next }));
                      }}
                      placeholder="সুবিধার বিবরণ লিখুন…"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          benefits: p.benefits.filter((_, i) => i !== idx),
                        }))
                      }
                      className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 text-slate-300 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {form.benefits.length === 0 && (
                  <p className="py-4 text-center text-xs font-medium text-slate-400">
                    No benefits added. Click Add to create one.
                  </p>
                )}
              </div>
            </SectionCard>

            {/* ── Dynamic website sections ── */}
            <SectionCard>
              <div className="flex items-center justify-between mb-1">
                <SectionTitle>Dynamic Website Sections</SectionTitle>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      websiteSections: [
                        ...p.websiteSections,
                        { id: newCourseWebsiteSectionId(), title: '', bodyHtml: '' },
                      ],
                    }))
                  }
                  disabled={form.websiteSections.length >= 20}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" /> Add Section
                </button>
              </div>
              <p className="mb-4 text-[11px] text-slate-400">
                Shown on{' '}
                <code className="rounded bg-slate-100 px-1 font-mono text-slate-600">
                  /course/{form.slug || 'slug'}
                </code>{' '}
                between benefits and books.
              </p>
              <div className="space-y-3">
                {form.websiteSections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-300 cursor-grab shrink-0" />
                      <Input
                        className={cn(field, 'flex-1')}
                        value={sec.title}
                        onChange={(e) => {
                          const next = [...form.websiteSections];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setForm((p) => ({ ...p, websiteSections: next }));
                        }}
                        placeholder="Section heading"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            setForm((p) => {
                              if (idx === 0) return p;
                              const next = [...p.websiteSections];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return { ...p, websiteSections: next };
                            })
                          }
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center justify-center"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === form.websiteSections.length - 1}
                          onClick={() =>
                            setForm((p) => {
                              if (idx >= p.websiteSections.length - 1) return p;
                              const next = [...p.websiteSections];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              return { ...p, websiteSections: next };
                            })
                          }
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center justify-center"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              websiteSections: p.websiteSections.filter((_, i) => i !== idx),
                            }))
                          }
                          className="h-8 w-8 rounded-lg border border-rose-100 bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <RichTextEditor
                      value={sec.bodyHtml}
                      onChange={(html) => {
                        const next = [...form.websiteSections];
                        next[idx] = { ...next[idx], bodyHtml: html };
                        setForm((p) => ({ ...p, websiteSections: next }));
                      }}
                      onImageUpload={async (file) => {
                        const res = await uploadQuestionImage(file);
                        return res.data?.url || '';
                      }}
                      placeholder="Section body content…"
                      className="min-h-[140px]"
                    />
                  </div>
                ))}
                {form.websiteSections.length === 0 && (
                  <p className="py-4 text-center text-xs font-medium text-slate-400">
                    No dynamic sections. Add one above if needed.
                  </p>
                )}
              </div>
            </SectionCard>

            {/* ── Public page display options ── */}
            <SectionCard>
              <SectionTitle>Public Course Page — Display Options</SectionTitle>
              <p className="mb-4 text-[11px] text-slate-400">
                Control which blocks appear on{' '}
                <code className="rounded bg-slate-100 px-1 font-mono text-slate-600">
                  /course/{form.slug || 'slug'}
                </code>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { key: 'publicShowBenefits', label: 'Benefits block', desc: 'Why enroll section' },
                    { key: 'publicShowWebsiteSections', label: 'Dynamic HTML sections', desc: 'Custom content blocks' },
                    { key: 'publicShowBooks', label: 'Recommended books', desc: 'Book listing' },
                    { key: 'publicShowCurriculum', label: 'Curriculum / content list', desc: 'Chapter & segment list' },
                  ] as const
                ).map((item) => (
                  <Toggle
                    key={item.key}
                    checked={form[item.key]}
                    onChange={(v) => setForm((p) => ({ ...p, [item.key]: v }))}
                    label={item.label}
                    description={item.desc}
                    accent="emerald"
                  />
                ))}
              </div>

              {form.publicShowCurriculum && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Visible content types in curriculum
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PUBLIC_CURRICULUM_CONTENT_TYPES.map((t) => {
                      const active = form.publicCurriculumTypes.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => togglePublicCurriculumType(t)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                            active
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                          )}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {curriculumContentTypeLabel(t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════ COURSE CONTENT ══════════════════════════ */}
        {activeTab === 'content' && course && (
          <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Chapters & Segments</h3>
              <Button
                onClick={() => {
                  setEditingResource(null);
                  setAddingToChapter(null);
                  setAddingChapterOrder(null);
                  setAddingSubjectTitle(null);
                  setShowResourceForm(true);
                }}
                size="sm"
                className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Chapter
              </Button>
            </div>

            {/* Content form dialog */}
            <Dialog
              open={showResourceForm}
              onOpenChange={(open) => {
                if (!open) {
                  setShowResourceForm(false);
                  setEditingResource(null);
                  setAddingToChapter(null);
                  setAddingChapterOrder(null);
                  setAddingSubjectTitle(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                  <DialogTitle className="text-base font-bold">
                    {editingResource
                      ? 'Edit Segment'
                      : addingToChapter
                        ? 'Add segment to chapter'
                        : 'Add new content'}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 pt-4">
                  <CourseResourceForm
                    key={`${course.id}-${editingResource?.id ?? 'new'}-${addingToChapter ?? 'root'}-${addingSubjectTitle ?? ''}`}
                    courseId={course.id}
                    resource={editingResource}
                    defaultSubjectTitle={
                      addingSubjectTitle != null
                        ? addingSubjectTitle || undefined
                        : addingToChapter
                          ? (() => {
                              const s = addingToChapter.split(':::')[0];
                              return s === 'General' ? '' : s;
                            })()
                          : undefined
                    }
                    defaultChapterTitle={
                      addingToChapter
                        ? (() => {
                            const p = addingToChapter.split(':::');
                            const c = p[1] || '';
                            return c === 'Ungrouped' ? '' : c;
                          })()
                        : undefined
                    }
                    defaultTopicTitle={undefined}
                    defaultTopicSortOrder={addingChapterOrder ?? undefined}
                    onSuccess={() => {
                      setShowResourceForm(false);
                      setEditingResource(null);
                      setAddingToChapter(null);
                      setAddingChapterOrder(null);
                      setAddingSubjectTitle(null);
                      fetchExtras();
                    }}
                    onCancel={() => {
                      setShowResourceForm(false);
                      setEditingResource(null);
                      setAddingToChapter(null);
                      setAddingChapterOrder(null);
                      setAddingSubjectTitle(null);
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {contentBySubject.sortedChapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-300">
                <FileText className="h-10 w-10 mb-3" />
                <p className="text-sm font-semibold">No content yet</p>
                <p className="text-xs mt-1">Click "New Chapter" to start building your course</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contentBySubject.orderedSubjects.map(([subjectTitle, chapterRows]) => {
                  const subjectKey = subjectTitle;
                  const subOpen = isSubjectOpen(subjectKey);
                  const segCount = chapterRows.reduce((n, [, items]) => n + items.length, 0);
                  const displaySubject =
                    subjectTitle === 'General' ? 'General (no subject)' : subjectTitle;

                  return (
                    <div
                      key={subjectKey}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                    >
                      {/* Subject header */}
                      <div className="flex items-center gap-0 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleSubject(subjectKey)}
                          className="flex flex-1 items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors min-w-0"
                        >
                          <div
                            className={cn(
                              'h-5 w-5 rounded-md flex items-center justify-center transition-colors shrink-0',
                              subOpen
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-slate-100 text-slate-400',
                            )}
                          >
                            {subOpen ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {displaySubject}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-bold uppercase shrink-0"
                              >
                                Subject
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {chapterRows.length} chapters · {segCount} segments
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingResource(null);
                              setAddingToChapter(null);
                              setAddingChapterOrder(null);
                              setAddingSubjectTitle(
                                subjectTitle === 'General' ? '' : subjectTitle,
                              );
                              setShowResourceForm(true);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Chapter
                          </button>
                          <button
                            type="button"
                            disabled={subjectRenaming}
                            onClick={() => startRename(subjectTitle)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                          >
                            <Pencil className="h-3 w-3" /> Rename
                          </button>
                        </div>
                      </div>

                      {/* Chapters */}
                      {subOpen && (
                        <div className="divide-y divide-slate-50 bg-slate-50/50">
                          {chapterRows.map(([compoundKey, items], chapterIdx) => {
                            const isExpanded = isChapterOpen(compoundKey);
                            const totalDuration = items.reduce(
                              (sum, r) => sum + (r.durationMinutes || 0),
                              0,
                            );
                            const videoCount = items.filter((r: any) => r.type === 'VIDEO').length;
                            const chapterOrder = items[0]?.topicSortOrder ?? chapterIdx;
                            const chapterPart = compoundKey.split(':::')[1] || 'Ungrouped';
                            const chapterHeading =
                              chapterPart === 'Ungrouped' && subjectTitle === 'General'
                                ? 'General content'
                                : chapterPart === 'Ungrouped'
                                  ? 'General'
                                  : chapterPart;

                            return (
                              <div key={compoundKey} className="bg-white mx-3 my-2 rounded-xl border border-slate-100 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleChapter(compoundKey)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 truncate">
                                      {chapterHeading}
                                    </p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-slate-400">
                                        {items.length} segments
                                      </span>
                                      {videoCount > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Play className="h-2.5 w-2.5" /> {videoCount} video
                                          {videoCount !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {totalDuration > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Clock className="h-2.5 w-2.5" /> {totalDuration} min
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                                    Ch {chapterIdx + 1}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="border-t border-slate-50">
                                    {items
                                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                      .map((res, idx) => (
                                        <div
                                          key={res.id}
                                          className="group flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-b-0 hover:bg-indigo-50/30 transition-colors"
                                        >
                                          <span className="w-5 shrink-0 text-center text-[10px] font-bold text-slate-300">
                                            {String(idx + 1).padStart(2, '0')}
                                          </span>
                                          <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors">
                                            {getResourceIcon(res.type)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-slate-700 truncate">
                                              {res.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                                                {res.type}
                                              </span>
                                              {res.isFree && (
                                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-600">
                                                  Free
                                                </span>
                                              )}
                                              {res.durationMinutes > 0 && (
                                                <span className="text-[10px] text-slate-400">
                                                  {res.durationMinutes} min
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                              type="button"
                                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:border-amber-200 hover:bg-amber-50 transition-colors"
                                              onClick={() => {
                                                setEditingResource(res);
                                                setAddingToChapter(null);
                                                setShowResourceForm(true);
                                              }}
                                            >
                                              <Pencil className="h-3 w-3 text-amber-500" />
                                            </button>
                                            <button
                                              type="button"
                                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:border-rose-200 hover:bg-rose-50 transition-colors"
                                              onClick={async () => {
                                                if (confirm('Delete this segment?')) {
                                                  await deleteCourseContent(res.id);
                                                  fetchExtras();
                                                }
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3 text-rose-400" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingResource(null);
                                        setAddingToChapter(compoundKey);
                                        setAddingChapterOrder(chapterOrder);
                                        setShowResourceForm(true);
                                      }}
                                      className="flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors border-t border-dashed border-slate-100"
                                    >
                                      <Plus className="h-3 w-3" /> Add Segment
                                    </button>
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
            )}
          </div>
        )}

        {/* ══════════════════════════ RELATED COURSES ═════════════════════════ */}
        {activeTab === 'related' && course && (
          <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Related Courses</h3>
              {!showAssociationForm && (
                <Button
                  onClick={() => setShowAssociationForm(true)}
                  size="sm"
                  className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Related
                </Button>
              )}
            </div>

            {showAssociationForm && (
              <SectionCard>
                <CourseAssociationForm
                  fromCourseId={course.id}
                  courses={allCourses}
                  onSuccess={() => {
                    setShowAssociationForm(false);
                    fetchExtras();
                  }}
                  onCancel={() => setShowAssociationForm(false)}
                />
              </SectionCard>
            )}

            {associations.length === 0 && !showAssociationForm ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-slate-300">
                <Link2 className="h-10 w-10 mb-3" />
                <p className="text-sm font-semibold">No related courses</p>
                <p className="text-xs mt-1">Link related courses to help students discover more</p>
              </div>
            ) : (
              <div className="space-y-2">
                {associations.map((assoc) => (
                  <div
                    key={assoc.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {assoc.type.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {assoc.toCourse?.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {assoc.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg border border-slate-100 bg-white text-slate-300 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-400 flex items-center justify-center transition-colors"
                      onClick={async () => {
                        if (confirm('Remove this association?')) {
                          await deleteAssociatedCourse(assoc.id);
                          fetchExtras();
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={closeModal}
            className="flex-1 h-11 rounded-xl border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-200"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </span>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Course'
            )}
          </Button>
        </div>
      </div>

      {/* ── Rename dialog ─────────────────────────────────────────────────── */}
      <SimpleDialog
        open={renameModal.open}
        onOpenChange={(open) => setRenameModal((prev) => ({ ...prev, open }))}
      >
        <SimpleDialogContent className="sm:max-w-sm rounded-2xl">
          <SimpleDialogHeader>
            <SimpleDialogTitle className="text-base font-bold">Rename Subject</SimpleDialogTitle>
          </SimpleDialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-xs text-slate-500">
              Updates the subject name across all chapters and segments within it.
            </p>
            <Input
              className={field}
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="e.g. Physics"
              autoFocus
            />
          </div>
          <SimpleDialogFooter className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRenameModal({ open: false, subject: '' })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitRename}
              disabled={subjectRenaming || !renameInput.trim()}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {subjectRenaming ? 'Saving…' : 'Save'}
            </Button>
          </SimpleDialogFooter>
        </SimpleDialogContent>
      </SimpleDialog>
    </div>
  );
}