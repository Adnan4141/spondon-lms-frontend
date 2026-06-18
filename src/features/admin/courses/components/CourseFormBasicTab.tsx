'use client';

import {
  AdmissionStatus,
  CourseStatus,
  CourseType,
  newCourseWebsiteSectionId,
  curriculumContentTypeLabel,
  PUBLIC_CURRICULUM_CONTENT_TYPES,
} from '@/types/course';
import { uploadQuestionImage } from '@/lib/api/question-bank';
import { LazyRichTextEditor as RichTextEditor } from '@/components/ui/lazy-rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildSlug,
  gradeOptions,
  groupOptions,
  statusOptions,
  typeOptions,
  type FormState,
} from './course-form-types';
import { field, FieldLabel, sectionLabel, SectionCard, SectionTitle, Toggle } from './course-form-ui';
import type { CourseFormController } from '../hooks/useCourseForm';

export function CourseFormBasicTab({ ctrl }: { ctrl: CourseFormController }) {
  const {
    form,
    setForm,
    programs,
    thumbnailPreview,
    thumbnailUploading,
    handleThumbnailUpload,
    clearThumbnail,
    togglePublicCurriculumType,
  } = ctrl;

  return (
          <div className="grid gap-5 py-2 sm:grid-cols-2 animate-in fade-in duration-300">
            <SectionCard className="sm:col-span-2">
              <SectionTitle>Identity</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Program</FieldLabel>
                  <Select
                    value={form.programId}
                    onValueChange={(value) => {
                      const selected = programs.find((p) => p.id === value);
                      const updates: Partial<FormState> = { programId: value };
                      // Clear timeline fields when switching to ONE_TIME program
                      if (selected?.paymentCircle !== 'MONTHLY') {
                        updates.startMonth = '';
                        updates.durationMonths = '';
                        updates.bookPrice = '';
                      }
                      setForm((prev) => ({ ...prev, ...updates }));
                    }}
                  >
                    <SelectTrigger className={field}>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id} className="text-sm font-medium">
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
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
                      onClick={clearThumbnail}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 transition-all hover:border-indigo-300 hover:bg-indigo-50/30',
                      thumbnailUploading && 'pointer-events-none opacity-50',
                    )}
                  >
                    {thumbnailUploading ? (
                      <p className="text-sm font-semibold text-indigo-500 animate-pulse">Uploading…</p>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-500">
                          {thumbnailPreview ? 'Replace thumbnail' : 'Upload thumbnail'}
                        </p>
                        <p className="text-[10px] text-slate-400">Any image format · Max 5 MB</p>
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

            <SectionCard>
              <SectionTitle>Pricing & Configuration</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
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
                      {typeOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-sm font-medium">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-sm font-medium">
                          {option}
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
                      <SelectItem value="OPEN" className="text-sm font-medium">OPEN</SelectItem>
                      <SelectItem value="CLOSED" className="text-sm font-medium">CLOSED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing type — read-only badge derived from program.paymentCircle */}
                <div>
                  <FieldLabel>Billing Type</FieldLabel>
                  {(() => {
                    const sel = programs.find((p) => p.id === form.programId);
                    const pc = sel?.paymentCircle;
                    if (!sel) {
                      return (
                        <div className="flex h-11 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5">
                          <span className="text-xs font-medium text-slate-400 italic">select a program first</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex h-11 items-center rounded-xl border border-slate-100 bg-slate-50 px-3.5 gap-2">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black',
                          pc === 'MONTHLY'
                            ? 'border border-green-200 bg-green-50 text-green-700'
                            : 'border border-indigo-200 bg-indigo-50 text-indigo-700',
                        )}>
                          <span className={cn('h-2 w-2 rounded-full inline-block', pc === 'MONTHLY' ? 'bg-green-500' : 'bg-indigo-500')} />
                          {pc === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">from program</span>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <FieldLabel>Fee</FieldLabel>
                  <Input
                    className={field}
                    type="number"
                    min="0"
                    value={form.fee}
                    onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <FieldLabel>Offer Price</FieldLabel>
                  <Input
                    className={field}
                    type="number"
                    min="0"
                    value={form.offerPrice}
                    onChange={(e) => setForm((p) => ({ ...p, offerPrice: e.target.value }))}
                    placeholder="Optional discounted price"
                  />
                </div>

                <div>
                  <label className={sectionLabel}>Grade</label>
                  <Select
                    value={form.grade || '_all'}
                    onValueChange={(v) => setForm((p) => ({ ...p, grade: v === '_all' ? '' : v }))}
                  >
                    <SelectTrigger className={field}>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="_all">All Grades</SelectItem>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade} className="text-sm font-medium">
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={sectionLabel}>Group</label>
                  <Select
                    value={form.group || '_all'}
                    onValueChange={(v) => setForm((p) => ({ ...p, group: v === '_all' ? '' : v }))}
                  >
                    <SelectTrigger className={field}>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="_all">All Groups</SelectItem>
                      {groupOptions.map((group) => (
                        <SelectItem key={group} value={group} className="text-sm font-medium">
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {programs.find((p) => p.id === form.programId)?.paymentCircle === 'MONTHLY' && (<>
                <div>
                  <FieldLabel>Start Month</FieldLabel>
                  <Input
                    className={field}
                    type="month"
                    value={form.startMonth}
                    onChange={(e) => setForm((p) => ({ ...p, startMonth: e.target.value }))}
                  />
                </div>

                <div>
                  <FieldLabel>Duration (Months)</FieldLabel>
                  <Input
                    className={field}
                    type="number"
                    min="1"
                    value={form.durationMonths}
                    onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))}
                    placeholder="e.g. 12"
                  />
                </div>

                {form.startMonth && form.durationMonths && Number(form.durationMonths) > 0 && (
                  <div>
                    <FieldLabel>End Month (auto)</FieldLabel>
                    <div className={field + ' flex items-center bg-slate-50 text-slate-500 font-medium cursor-default select-none'}>
                      {(() => {
                        const [y, m] = form.startMonth.split('-').map(Number);
                        const d = new Date(y, m - 1 + Number(form.durationMonths) - 1, 1);
                        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                      })()}
                    </div>
                  </div>
                )}

                <div>
                  <FieldLabel>Book Price (৳)</FieldLabel>
                  <Input
                    className={field}
                    type="number"
                    min="0"
                    value={form.bookPrice}
                    onChange={(e) => setForm((p) => ({ ...p, bookPrice: e.target.value }))}
                    placeholder="e.g. 350"
                  />
                </div>
                </>)}
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
  );
}
