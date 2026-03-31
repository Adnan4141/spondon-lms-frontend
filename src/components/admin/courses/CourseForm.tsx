'use client';

import { useState, useEffect, useMemo } from 'react';
import { createCourse, updateCourse, getCourses, getCourseContents, deleteCourseContent, getAssociatedCourses, deleteAssociatedCourse, uploadCourseThumbnail, updateCourseContent } from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import {
  AdmissionStatus,
  BillingType,
  CourseStatus,
  CourseType,
  CreateCourseDto,
  UpdateCourseDto,
  Program,
  CourseDetails,
} from '@/types/course';
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
  ExternalLink,
  FileText,
  Video,
  FileCheck,
  Eye,
  CheckCircle2,
  Monitor,
  GraduationCap,
  Upload,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  Pencil,
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

const statusOptions: CourseStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: CourseType[] = ['ONLINE', 'OFFLINE'];
const billingOptions: BillingType[] = ['ONE_TIME', 'MONTHLY'];
const admissionOptions: AdmissionStatus[] = ['OPEN', 'CLOSED'];

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const textareaClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

function checkboxClass() {
  return 'h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer';
}

type FormState = {
  programId: string;
  name: string;
  slug: string;
  code: string;
  thumbnail: string;
  type: CourseType;
  billingType: BillingType;
  fee: string;
  offerDiscountAmount: string;
  offerDiscountNote: string;
  description: string;
  status: CourseStatus;
  admissionStatus: AdmissionStatus;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  settledOptionEnabled: boolean;
};

const defaultForm: FormState = {
  programId: '',
  name: '',
  slug: '',
  code: '',
  thumbnail: '',
  type: 'ONLINE',
  billingType: 'ONE_TIME',
  fee: '0',
  offerDiscountAmount: '',
  offerDiscountNote: '',
  description: '',
  status: 'ACTIVE',
  admissionStatus: 'OPEN',
  featured: false,
  websiteVisible: true,
  enrollmentVisible: true,
  settledOptionEnabled: false,
};

interface CourseFormProps {
  programs: Program[];
  course?: CourseDetails | null;
  onSuccess: () => Promise<void>;
}

export function CourseForm({ programs, course, onSuccess }: CourseFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  // Start with all subjects/chapters expanded for easier editing
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
  const [renameModal, setRenameModal] = useState<{ open: boolean; subject: string }>({ open: false, subject: '' });
  const [renameInput, setRenameInput] = useState('');

  const isEdit = !!course;

  const fetchExtras = async () => {
    if (!course?.id) return;
    try {
      const [resRes, assocRes, coursesRes] = await Promise.all([
        getCourseContents({ courseId: course.id }),
        getAssociatedCourses({ fromCourseId: course.id }),
        getCourses({})
      ]);
      if (resRes.success) setResources(resRes.data || []);
      if (assocRes.success) setAssociations(assocRes.data || []);
      if (coursesRes.success) setAllCourses(coursesRes.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (course) {
      setForm({
        programId: course.programId,
        name: course.name,
        slug: course.slug,
        code: course.code,
        thumbnail: course.thumbnail || '',
        type: course.type,
        billingType: course.billingType,
        fee: String(course.fee),
        offerDiscountAmount:
          course.offerDiscountAmount != null && String(course.offerDiscountAmount) !== ''
            ? String(course.offerDiscountAmount)
            : '',
        offerDiscountNote: course.offerDiscountNote || '',
        description: course.description || '',
        status: course.status,
        admissionStatus: course.admissionStatus,
        featured: course.featured,
        websiteVisible: course.websiteVisible,
        enrollmentVisible: course.enrollmentVisible !== false,
        settledOptionEnabled: course.settledOptionEnabled,
      });
      if (course.thumbnail) {
        const url = resolveAttachmentUrl(course.thumbnail, API_ORIGIN);
        setThumbnailPreview(url);
      }
      fetchExtras();
    }
  }, [course]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setThumbnailPreview(localUrl);

    if (isEdit && course) {
      // Upload to server right away for existing courses
      try {
        setThumbnailUploading(true);
        const res = await uploadCourseThumbnail(course.id, file);
        if (res.success && res.data?.thumbnail) {
          const stored = res.data.thumbnail;
          const url = resolveAttachmentUrl(stored, API_ORIGIN);
          setForm((prev) => ({ ...prev, thumbnail: stored }));
          setThumbnailPreview(url);
          toast({ title: 'Thumbnail uploaded', variant: 'success' });
        }
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
        setThumbnailPreview(form.thumbnail ? resolveAttachmentUrl(form.thumbnail, API_ORIGIN) : null);
      } finally {
        setThumbnailUploading(false);
      }
    } else {
      // For new courses, store the file for upload after creation
      // We'll use the local preview for now, and the URL placeholder
      setForm((prev) => ({ ...prev, thumbnail: '' }));
      // Store file ref in a data attribute via closure
      (handleThumbnailUpload as any).__pendingFile = file;
    }
  };

  const isSubjectOpen = (subjectKey: string) => expandedSubjects[subjectKey] === true;
  const toggleSubject = (subjectKey: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectKey]: !isSubjectOpen(subjectKey),
    }));
  };

  const isChapterOpen = (chapterKey: string) => expandedChapters[chapterKey] === true;
  const toggleChapter = (chapter: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapter]: !isChapterOpen(chapter) }));
  };

  const startRename = (subject: string) => {
    const current = subject === 'General' ? '' : subject;
    setRenameInput(current);
    setRenameModal({ open: true, subject });
  };

  const submitRename = async () => {
    const oldSubject = renameModal.subject;
    const oldKey = oldSubject === 'General' ? '' : oldSubject;
    const trimmed = renameInput.trim();
    if (trimmed === oldKey.trim()) {
      setRenameModal({ open: false, subject: '' });
      return;
    }
    try {
      setSubjectRenaming(true);
      const targets = resources.filter((r) => {
        const s = (r.subjectTitle || '').trim();
        return (s || '') === oldKey;
      });
      await Promise.all(
        targets.map(async (r) => {
          const fd = new FormData();
          fd.append('subjectTitle', trimmed);
          return updateCourseContent(r.id, fd);
        })
      );
      toast({ title: 'Subject renamed', description: `${oldSubject || 'General'} → ${trimmed || 'General'}`, variant: 'success' });
      await fetchExtras();
    } catch (err) {
      toast({ title: 'Rename failed', description: err instanceof Error ? err.message : 'Could not rename subject', variant: 'destructive' });
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
      if (subCmp !== 0) return subCmp;
      return aOrder - bOrder;
    });

    const subjectGroups = new Map<string, [string, typeof resources][]>();
    for (const row of sortedChapters) {
      const [compoundKey] = row;
      const subjectPart = compoundKey.split(':::')[0] || 'General';
      if (!subjectGroups.has(subjectPart)) subjectGroups.set(subjectPart, []);
      subjectGroups.get(subjectPart)!.push(row);
    }
    const orderedSubjects = [...subjectGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return { sortedChapters, orderedSubjects };
  }, [resources]);

  const handleSubmit = async () => {
    const parsedFee = Number(form.fee);

    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setError('Fee must be a valid positive number.');
      return;
    }

    let offerDisc: number | null | undefined;
    if (form.offerDiscountAmount.trim() === '') {
      offerDisc = isEdit ? null : undefined;
    } else {
      const od = Number(form.offerDiscountAmount);
      if (Number.isNaN(od) || od < 0) {
        setError('Offer discount must be a valid non-negative number.');
        return;
      }
      offerDisc = od;
    }

    if (!form.programId || !form.name.trim() || !form.slug.trim() || !form.code.trim()) {
      setError('Program, name, slug, and code are required.');
      return;
    }

    const payload: CreateCourseDto | UpdateCourseDto = {
      programId: form.programId,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      code: form.code.trim(),
      thumbnail: form.thumbnail.trim() || undefined,
      type: form.type,
      billingType: form.billingType,
      fee: parsedFee,
      ...(offerDisc !== undefined ? { offerDiscountAmount: offerDisc } : {}),
      offerDiscountNote: form.offerDiscountNote.trim() || (isEdit ? null : undefined),
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
           // Upload pending thumbnail for newly created course
           const pendingFile = (handleThumbnailUpload as any).__pendingFile as File | undefined;
           if (pendingFile && res.data.id) {
             try {
               await uploadCourseThumbnail(res.data.id, pendingFile);
             } catch { /* thumbnail upload failed silently */ }
             (handleThumbnailUpload as any).__pendingFile = undefined;
           }
           toast({ title: 'Created', description: 'Course created successfully. You can now add content.', variant: 'success' });
           // If creation was successful, we might want to stay in edit mode to add resources
           // but for simplicity, let's just close and refresh
           closeModal();
           await onSuccess();
           return;
        }
      }
      
      toast({
        title: 'Success',
        description: `Course ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEdit ? 'update' : 'create'} course`;
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'SYLLABUS': return <FileCheck className="h-4 w-4" />;
      case 'LEAFLET': return <Eye className="h-4 w-4" />;
      case 'SCHEDULE': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white text-slate-900">
      {/* Tab Navigation */}
      <div className="px-8 pt-4 border-b border-slate-100 flex gap-8 bg-slate-50/30 shrink-0">
        {[
          { id: 'basic', label: 'Basic Info', icon: Info },
          { id: 'content', label: 'Course Content', icon: FileUp, disabled: !isEdit },
          { id: 'related', label: 'Related Courses', icon: Link2, disabled: !isEdit },
        ].map(tab => (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2",
              activeTab === tab.id ? "text-indigo-600" : "text-black hover:text-slate-600",
              tab.disabled && "opacity-30 cursor-not-allowed"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        {activeTab === 'basic' && (
          <div className="grid gap-8 py-2 sm:grid-cols-2 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className={sectionLabel}>Program</label>
              <Select
                value={form.programId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, programId: value }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Program" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id} className="text-sm font-medium">
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Course Code</label>
              <Input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g., HSC-PHY-01"
              />
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Course Slug</label>
              <Input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g., hsc-physics-01"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className={sectionLabel}>Course Title</label>
              <Input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full course name"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className={sectionLabel}>Course Thumbnail</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                {(() => {
                  const preview = thumbnailPreview || (form.thumbnail ? resolveAttachmentUrl(form.thumbnail, API_ORIGIN) : null);
                  return preview ? (
                  <div className="relative shrink-0 group">
                    <img
                      src={preview}
                      alt="Thumbnail"
                      className="h-28 w-44 rounded-2xl border border-slate-200 object-cover shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => { setThumbnailPreview(null); setForm((prev) => ({ ...prev, thumbnail: '' })); }}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ✕
                    </button>
                  </div>
                  ) : null;
                })()}
                {/* Upload area */}
                <label className="flex-1 cursor-pointer">
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 px-4 transition-all hover:border-indigo-400 hover:bg-white",
                    thumbnailUploading && "opacity-50 pointer-events-none"
                  )}>
                    {thumbnailUploading ? (
                      <span className="text-sm font-bold text-indigo-600 animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-300" />
                        <span className="text-sm font-bold text-slate-500">
                          {thumbnailPreview ? 'Change thumbnail' : 'Click to upload thumbnail'}
                        </span>
                        <span className="text-[10px] text-slate-400">All image formats supported · Max 5MB</span>
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
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Course Type</label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as CourseType }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {typeOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-sm font-medium">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Billing Type</label>
              <Select
                value={form.billingType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, billingType: value as BillingType }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {billingOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-sm font-medium">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.billingType === 'MONTHLY' && (
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  Monthly courses bill students every month. Set the fee as the amount due each month. When enrolling students,
                  set their billing start month; run <span className="font-bold text-slate-700">Monthly billing</span> in admin
                  to create invoices (benefits apply automatically).
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className={sectionLabel}>
                {form.billingType === 'MONTHLY' ? 'Monthly tuition (৳)' : 'Tuition fee (৳)'}
              </label>
              <Input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={form.fee}
                onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2 rounded-2xl border border-amber-100 bg-amber-50/30 p-4">
              <label className={sectionLabel}>অফার ডিস্কাউন্ট (কোর্সে সংযুক্ত · পরে এডিট করা যাবে)</label>
              <p className="mb-3 text-[10px] font-bold text-amber-900/80">
                ভর্তির ধাপে এই মান ডিফল্ট হিসেবে আসবে। ডিস্কাউন্ট দিলে রেফারেন্স/নোট এখানে রাখুন; অফলাইন পেমেন্টে আলাদা রেফারেন্সও লাগবে।
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}>Offer amount (৳)</label>
                  <Input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.offerDiscountAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, offerDiscountAmount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={sectionLabel}>Offer label / note (e.g. Eid 2026)</label>
                  <Input
                    className={inputClass}
                    value={form.offerDiscountNote}
                    onChange={(e) => setForm((prev) => ({ ...prev, offerDiscountNote: e.target.value }))}
                    placeholder="Shown when prefilling admission discount"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className={sectionLabel}>Course Overview</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
                onImageUpload={async (file) => {
                  const res = await uploadQuestionImage(file);
                  return res.data?.url || '';
                }}
                placeholder="Describe the course curriculum..."
                className="min-h-[200px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  className={checkboxClass()}
                />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600 transition-colors">Featured</span>
              </label>
              
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.websiteVisible}
                  onChange={(e) => setForm((prev) => ({ ...prev, websiteVisible: e.target.checked }))}
                  className={checkboxClass()}
                />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600 transition-colors">Website Visible</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.enrollmentVisible}
                  onChange={(e) => setForm((prev) => ({ ...prev, enrollmentVisible: e.target.checked }))}
                  className={checkboxClass()}
                />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600 transition-colors">Enrollment No Visible</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.settledOptionEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, settledOptionEnabled: e.target.checked }))}
                  className={checkboxClass()}
                />
                <span className="text-[11px] font-black uppercase tracking-widest text-rose-800 group-hover:text-rose-900 transition-colors">
                  Settle course option (admin can mark all dues paid, cancel enrollments, remove from student portal)
                </span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'content' && course && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black tracking-tight">Course Content</h3>
               <Button
                 onClick={() => {
                   setEditingResource(null);
                   setAddingToChapter(null);
                   setAddingChapterOrder(null);
                   setAddingSubjectTitle(null);
                   setShowResourceForm(true);
                 }}
                 size="sm"
                 className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black font-black uppercase tracking-widest text-[9px]"
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
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                  <DialogTitle className="text-lg font-black tracking-tight">
                    {editingResource
                      ? 'Edit Segment'
                      : addingToChapter
                        ? 'Add segment to chapter'
                        : 'Add new content'}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
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

            {/* Subject (expand) → chapter → segment — matches student portal & details view */}
            {contentBySubject.sortedChapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <FileText className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold">No content yet</p>
                <p className="text-xs mt-1">Click &quot;New Chapter&quot; to start building your course</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contentBySubject.orderedSubjects.map(([subjectTitle, chapterRows]) => {
                  const subjectKey = subjectTitle;
                  const subOpen = isSubjectOpen(subjectKey);
                  const segCount = chapterRows.reduce((n, [, items]) => n + items.length, 0);
                  const displaySubject = subjectTitle === 'General' ? 'General (no subject)' : subjectTitle;

                  return (
                    <div
                      key={subjectKey}
                      className="rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden"
                    >
                      <div className="flex items-stretch gap-2 border-b border-slate-100 bg-white/80">
                        <button
                          type="button"
                          onClick={() => toggleSubject(subjectKey)}
                          className="flex flex-1 items-center gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors min-w-0"
                        >
                          {subOpen ? (
                            <ChevronDown className="h-4 w-4 text-indigo-600 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 truncate">
                              Subject
                            </h4>
                            <p className="text-sm font-black text-slate-900 truncate">{displaySubject}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                              {chapterRows.length} {chapterRows.length === 1 ? 'chapter' : 'chapters'} · {segCount}{' '}
                              {segCount === 1 ? 'segment' : 'segments'}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center pr-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl text-[9px] font-black uppercase shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResource(null);
                              setAddingToChapter(null);
                              setAddingChapterOrder(null);
                              setAddingSubjectTitle(subjectTitle === 'General' ? '' : subjectTitle);
                              setShowResourceForm(true);
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Chapter
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-9 rounded-xl text-[9px] font-black uppercase shrink-0 text-slate-500 hover:text-indigo-600"
                            disabled={subjectRenaming}
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(subjectTitle);
                            }}
                          >
                            Rename
                          </Button>
                        </div>
                      </div>

                      {subOpen && (
                        <div className="space-y-3 p-3 bg-white/60">
                          {chapterRows.map(([compoundKey, items], chapterIdx) => {
                            const isExpanded = isChapterOpen(compoundKey);
                            const totalDuration = items.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
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
                              <div
                                key={compoundKey}
                                className="rounded-2xl border border-slate-100 bg-white overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleChapter(compoundKey)}
                                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-indigo-500 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 truncate">{chapterHeading}</h4>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {items.length} {items.length === 1 ? 'segment' : 'segments'}
                                      </span>
                                      {videoCount > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                          <Play className="h-2.5 w-2.5" /> {videoCount} video
                                          {videoCount !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {totalDuration > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                          <Clock className="h-2.5 w-2.5" /> {totalDuration} min
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[8px] font-black uppercase shrink-0">
                                    Ch {chapterIdx + 1}
                                  </Badge>
                                </button>

                                {isExpanded && (
                                  <div className="border-t border-slate-50">
                                    {items
                                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                      .map((res, idx) => (
                                        <div
                                          key={res.id}
                                          className="group flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/40 transition-colors border-b border-slate-50 last:border-b-0"
                                        >
                                          <span className="text-[10px] font-black text-slate-300 w-5 text-center shrink-0">
                                            {String(idx + 1).padStart(2, '0')}
                                          </span>
                                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shrink-0">
                                            {getResourceIcon(res.type)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h5 className="text-[13px] font-bold text-slate-700 truncate">{res.title}</h5>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <Badge variant="outline" className="text-[7px] font-black uppercase">
                                                {res.type}
                                              </Badge>
                                              {res.isFree && (
                                                <Badge className="text-[7px] font-black uppercase bg-emerald-50 text-emerald-600 border-emerald-200">
                                                  Free
                                                </Badge>
                                              )}
                                              {res.durationMinutes > 0 && (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                  {res.durationMinutes} min
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className="h-7 w-7 rounded-lg border-slate-200"
                                              onClick={() => {
                                                setEditingResource(res);
                                                setAddingToChapter(null);
                                                setShowResourceForm(true);
                                              }}
                                            >
                                              <Pencil className="h-3 w-3 text-amber-500" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className="h-7 w-7 rounded-lg border-slate-200 hover:bg-rose-50"
                                              onClick={async () => {
                                                if (confirm('Delete this segment?')) {
                                                  await deleteCourseContent(res.id);
                                                  fetchExtras();
                                                }
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3 text-rose-500" />
                                            </Button>
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
                                      className="flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors border-t border-dashed border-slate-100"
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

        {activeTab === 'related' && course && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black tracking-tight">Related Courses</h3>
               {!showAssociationForm && (
                 <Button onClick={() => setShowAssociationForm(true)} size="sm" className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black font-black uppercase tracking-widest text-[9px]">
                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Related Course
                 </Button>
               )}
            </div>

            {showAssociationForm && (
              <CourseAssociationForm 
                fromCourseId={course.id} 
                courses={allCourses}
                onSuccess={() => { setShowAssociationForm(false); fetchExtras(); }}
                onCancel={() => setShowAssociationForm(false)}
              />
            )}

            <div className="grid gap-4">
               {associations.map(assoc => (
                 <div key={assoc.id} className="p-4 rounded-2xl border border-slate-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-inner">
                          {assoc.type.charAt(0)}
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-800">{assoc.toCourse?.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{assoc.type}</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={async () => { if(confirm('Sever?')){ await deleteAssociatedCourse(assoc.id); fetchExtras(); } }}>
                       <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={closeModal}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </div>

      <SimpleDialog open={renameModal.open} onOpenChange={(open) => setRenameModal((prev) => ({ ...prev, open }))}>
        <SimpleDialogContent className="sm:max-w-md">
          <SimpleDialogHeader>
            <SimpleDialogTitle className="text-lg font-black text-slate-900">Rename subject</SimpleDialogTitle>
          </SimpleDialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Update the subject name. This applies to all chapters and segments under it.</p>
            <Input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="e.g., Physics"
            />
          </div>
          <SimpleDialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameModal({ open: false, subject: '' })}>Cancel</Button>
            <Button onClick={submitRename} disabled={subjectRenaming || !renameInput.trim()}>Save</Button>
          </SimpleDialogFooter>
        </SimpleDialogContent>
      </SimpleDialog>
    </div>
  );
}
