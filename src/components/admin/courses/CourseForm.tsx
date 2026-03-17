'use client';

import { useState, useEffect } from 'react';
import { createCourse, updateCourse, getCourses, getCourseContents, deleteCourseContent, getAssociatedCourses, deleteAssociatedCourse } from '@/lib/api/courses';
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
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CourseResourceForm } from './CourseResourceForm';
import { CourseAssociationForm } from './CourseAssociationForm';

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
  
  const [activeTab, setActiveTab] = useState<'basic' | 'resources' | 'links'>('basic');
  const [resources, setResources] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

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
        description: course.description || '',
        status: course.status,
        admissionStatus: course.admissionStatus,
        featured: course.featured,
        websiteVisible: course.websiteVisible,
        enrollmentVisible: course.enrollmentVisible !== false,
        settledOptionEnabled: course.settledOptionEnabled,
      });
      fetchExtras();
    }
  }, [course]);

  const handleSubmit = async () => {
    const parsedFee = Number(form.fee);

    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setError('Fee must be a valid positive number.');
      return;
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
           toast({ title: 'Deployed', description: 'Basic configuration active. You can now add resources.', variant: 'success' });
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
          { id: 'basic', label: 'Basic Configuration', icon: Info },
          { id: 'resources', label: 'Assets & Media', icon: FileUp, disabled: !isEdit },
          { id: 'links', label: 'Connections', icon: Link2, disabled: !isEdit },
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
              <label className={sectionLabel}>Program Hierarchy</label>
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
              <label className={sectionLabel}>Official Title</label>
              <Input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full course name"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className={sectionLabel}>Thumbnail URL</label>
              <Input
                className={inputClass}
                value={form.thumbnail}
                onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="https://example.com/thumbnail.png"
              />
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Modality</label>
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
              <label className={sectionLabel}>Billing Structure</label>
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
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className={sectionLabel}>Tuition Fee (৳)</label>
              <Input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={form.fee}
                onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))}
              />
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
            </div>
          </div>
        )}

        {activeTab === 'resources' && course && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black tracking-tight">Manage Assets</h3>
               {!showResourceForm && (
                 <Button onClick={() => { setEditingResource(null); setShowResourceForm(true); }} size="sm" className="h-9 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[9px]">
                    <Plus className="mr-2 h-3.5 w-3.5" /> Deploy Resource
                 </Button>
               )}
            </div>

            {showResourceForm && (
              <CourseResourceForm 
                courseId={course.id} 
                resource={editingResource}
                onSuccess={() => { setShowResourceForm(false); fetchExtras(); }}
                onCancel={() => setShowResourceForm(false)}
              />
            )}

            <div className="grid gap-3">
               {resources.map(res => (
                 <div key={res.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-inner">
                          {getResourceIcon(res.type)}
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-800">{res.title}</h4>
                          <Badge variant="outline" className="text-[7px] font-black uppercase mt-0.5">{res.type}</Badge>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => { setEditingResource(res); setShowResourceForm(true); }}>
                          <FileText className="h-3.5 w-3.5 text-amber-500" />
                       </Button>
                       <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 hover:bg-rose-50" onClick={async () => { if(confirm('Delete?')){ await deleteCourseContent(res.id); fetchExtras(); } }}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                       </Button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'links' && course && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black tracking-tight">Manage Linkages</h3>
               {!showAssociationForm && (
                 <Button onClick={() => setShowAssociationForm(true)} size="sm" className="h-9 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase tracking-widest text-[9px]">
                    <Plus className="mr-2 h-3.5 w-3.5" /> Establish Link
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
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Update Changes' : 'Deploy Course'}
          </Button>
        </div>
      </div>
    </div>
  );
}
