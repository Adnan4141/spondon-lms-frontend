'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, useMemo, type ComponentProps } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  approveTestimonial,
  createAdminTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  updateTestimonial,
  reorderTestimonials,
  type TestimonialAdmin,
} from '@/lib/api/testimonials';
import { getUsers, type User as AppUser } from '@/lib/api/users';
import { getCourses } from '@/lib/api/courses';
import { getBatches, type Batch } from '@/lib/api/batches';
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Star,
  Search,
  Check,
  ChevronsUpDown,
  MoreVertical,
  Quote,
  Activity,
  User,
  BookOpen,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

type InputFieldProps = {
  label: string;
  required?: boolean;
} & ComponentProps<typeof Input>;

const InputField = ({ label, required, className, ...props }: InputFieldProps) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Input
      {...props}
      className={cn('h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white', className)}
    />
  </div>
);

type SearchSelectOption = {
  id: string;
  label: string;
};

type SearchSelectFieldProps = {
  label: string;
  placeholder: string;
  options: SearchSelectOption[];
  defaultValue?: string;
  onValueChange: (input: string, selected?: SearchSelectOption) => void;
};

type RatingFieldProps = {
  defaultValue?: number | null;
  onChange: (value: number) => void;
};

const SearchSelectField = ({
  label,
  placeholder,
  options,
  defaultValue,
  onValueChange,
}: SearchSelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultValue || '');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 40);
  }, [options, query]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 px-3 justify-between font-medium text-slate-700 hover:bg-white"
          >
            <span className="truncate text-left">{query || <span className="text-slate-400 font-normal">{placeholder}</span>}</span>
            <ChevronsUpDown className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-2 rounded-xl">
          <Input
            value={query}
            placeholder={placeholder}
            className="h-10 rounded-lg"
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setSelectedId(null);
              onValueChange(value);
            }}
          />
          <div className="mt-2 max-h-56 overflow-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="px-2 py-2 text-xs font-medium text-slate-400">No results</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="ghost"
                    className={cn(
                      'w-full justify-start rounded-lg px-2 h-9 text-sm',
                      isSelected && 'bg-indigo-50 text-indigo-700 font-bold',
                    )}
                    onClick={() => {
                      setQuery(opt.label);
                      setSelectedId(opt.id);
                      onValueChange(opt.label, opt);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', isSelected ? 'text-emerald-600' : 'text-transparent')} />
                    <span className="truncate">{opt.label}</span>
                  </Button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const RatingField = ({ defaultValue = 5, onChange }: RatingFieldProps) => {
  const [rating, setRating] = useState(defaultValue || 5);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rating</label>
      <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-4 h-12">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              setRating(star);
              onChange(star);
            }}
            className={cn('transition', rating >= star ? 'scale-110' : 'opacity-40')}
          >
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </button>
        ))}
        <span className="ml-auto text-xs font-bold text-slate-500">{rating}/5</span>
      </div>
    </div>
  );
};

// Sortable Testimonial Row Component
function SortableTestimonialRow({ testimonial }: { testimonial: TestimonialAdmin }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: testimonial.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <TableRow ref={setNodeRef} style={style} className="bg-white hover:bg-indigo-50/30 transition-colors">
      <TableCell className="py-4 px-4 w-12">
        <button
          className="cursor-grab active:cursor-grabbing p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </TableCell>
      <TableCell className="py-4 px-4" colSpan={5}>
        <div className="flex items-center gap-4">
          <Quote className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-base font-black text-slate-900">{testimonial.name}</p>
            <p className="text-xs text-slate-500 font-semibold truncate max-w-md">{testimonial.quote}</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminTestimonialsPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [testimonials, setTestimonials] = useState<TestimonialAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'published'>('all');
  const [students, setStudents] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string; code?: string | null }>>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Sort mode state
  const [sortMode, setSortMode] = useState(false);
  const [orderedTestimonials, setOrderedTestimonials] = useState<TestimonialAdmin[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllTestimonials();
      if (res.success) setTestimonials(res.data || []);
    } catch (err) {
      toast({ title: 'Load failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setOrderedTestimonials(testimonials);
  }, [testimonials]);

  // DnD handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedTestimonials((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const items = orderedTestimonials.map((t, i) => ({ id: t.id, sortOrder: i }));
      await reorderTestimonials(items);
      await load();
      setSortMode(false);
      toast({ title: 'Order saved', description: 'Testimonials order updated successfully.', variant: 'default' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save order.', variant: 'destructive' });
    } finally {
      setSavingOrder(false);
    }
  };

  useEffect(() => {
    async function loadLookups() {
      try {
        const [studentRes, courseRes, batchRes] = await Promise.all([
          getUsers({ role: 'STUDENT', status: 'ACTIVE', limit: 300 }),
          getCourses({ status: 'ACTIVE', limit: 300 }),
          getBatches({ status: 'ACTIVE', limit: 400 }),
        ]);

        if (studentRes.success) setStudents(studentRes.data || []);
        if (courseRes.success) {
          setCourses(
            (courseRes.data || []).map((c: { id: string; name: string; code?: string | null }) => ({
              id: c.id,
              name: c.name,
              code: c.code || null,
            }))
          );
        }
        if (batchRes.success) setBatches(batchRes.data || []);
      } catch {
        // Keep form usable even if lookups fail.
      }
    }

    loadLookups();
  }, []);

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => {
      const matchesSearch = 
        (t.student?.fullName || t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.course?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.quote || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filterStatus === 'all' || 
        (filterStatus === 'pending' && !t.approved) || 
        (filterStatus === 'published' && t.approved);
        
      return matchesSearch && matchesFilter;
    });
  }, [testimonials, searchQuery, filterStatus]);

  const openForm = (existing?: TestimonialAdmin) => {
    const formData = existing
      ? { ...existing }
      : {
          name: '',
          quote: '',
          institute: '',
          info: '',
          rating: 5,
          courseId: '',
          studentUserId: '',
          thumbnailUrl: '',
          sortOrder: 0,
        };
    let thumbnailFile: File | null = null;
    let lastAutoBatchValue = '';

    openModal({
      title: existing ? 'Edit Testimonial' : 'Create Testimonial',
      description: 'Manage quote, image, video, and publish order for landing page testimonials.',
      className: 'sm:max-w-5xl p-0 overflow-hidden',
      content: (
        <div className="space-y-8 p-6 sm:p-8 lg:p-10 bg-white">
  {!existing && (
    <div className="flex gap-3 items-start rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
      <Activity className="h-5 w-5 mt-0.5 shrink-0" />
      <p>
        Create a testimonial manually. You can attach a thumbnail or use an external image/video.
      </p>
    </div>
  )}

  {/* ---------------- STUDENT INFO ---------------- */}
  <div className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-5 sm:p-6">
    <h3 className="text-sm font-black tracking-wide text-slate-700 uppercase">
      Student Info
    </h3>

    <div className="grid gap-5 sm:grid-cols-2">
      <SearchSelectField
        label="Student"
        placeholder="Search student by name/mobile"
        options={students.map((s) => ({ id: s.id, label: `${s.fullName} (${s.mobile})` }))}
        defaultValue={
          students.find((s) => s.id === formData.studentUserId)
            ? `${students.find((s) => s.id === formData.studentUserId)?.fullName} (${students.find((s) => s.id === formData.studentUserId)?.mobile})`
            : (formData.studentUserId || '')
        }
        onValueChange={(input, selected) => {
          formData.studentUserId = selected?.id || input.trim();
          if (selected) {
            const matched = students.find((s) => s.id === selected.id);
            if (matched) {
              formData.name = matched.fullName;
              const displayNameInput = document.getElementById('testimonial-display-name') as HTMLInputElement | null;
              if (displayNameInput) displayNameInput.value = matched.fullName;
            }
          }
        }}
      />

      <SearchSelectField
        label="Course"
        placeholder="Search course by name/code"
        options={courses.map((c) => ({ id: c.id, label: `${c.name}${c.code ? ` (${c.code})` : ''}` }))}
        defaultValue={
          courses.find((c) => c.id === formData.courseId)
            ? `${courses.find((c) => c.id === formData.courseId)?.name}${courses.find((c) => c.id === formData.courseId)?.code ? ` (${courses.find((c) => c.id === formData.courseId)?.code})` : ''}`
            : (formData.courseId || '')
        }
        onValueChange={(input, selected) => {
          formData.courseId = selected?.id || input.trim();
        }}
      />

      <InputField id="testimonial-display-name" label="Display Name" required placeholder="Student name" onChange={(e)=>formData.name=e.target.value} defaultValue={formData.name}/>

      <InputField
        label="Institute Name"
        placeholder="e.g. Dhaka College, Notre Dame College"
        defaultValue={formData.institute || ''}
        onChange={(e) => (formData.institute = e.target.value)}
      />

      <SearchSelectField
        label="Batch (Searchable)"
        placeholder="Search batch name"
        options={batches.map((b) => ({ id: b.id, label: `${b.name}${b.course?.name ? ` - ${b.course.name}` : ''}` }))}
        onValueChange={(_input, selected) => {
          if (!selected) return;
          const batch = batches.find((b) => b.id === selected.id);
          if (!batch) return;

          const infoInput = document.getElementById('testimonial-info') as HTMLInputElement | null;
          if (infoInput) {
            const current = infoInput.value.trim();
            if (!current || current === lastAutoBatchValue) {
              infoInput.value = batch.name;
              formData.info = batch.name;
              lastAutoBatchValue = batch.name;
            }
          }
        }}
      />

      <InputField id="testimonial-info" label="Batch / Info" placeholder="HSC 2024" onChange={(e)=>formData.info=e.target.value} defaultValue={formData.info}/>
    </div>
  </div>

  {/* ---------------- CONTENT ---------------- */}
  <div className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-5 sm:p-6">
    <h3 className="text-sm font-black tracking-wide text-slate-700 uppercase">
      Content
    </h3>

    <RatingField
      defaultValue={formData.rating}
      onChange={(value) => {
        formData.rating = value;
      }}
    />

    {/* Quote */}
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Testimonial</label>
      <Textarea
        defaultValue={formData.quote}
        placeholder="What did the student say?"
        className="min-h-32 rounded-xl"
        onChange={(e)=>formData.quote = e.target.value}
      />
    </div>
  </div>

  {/* ---------------- MEDIA ---------------- */}
  <div className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-5 sm:p-6">
    <h3 className="text-sm font-black tracking-wide text-slate-700 uppercase">
      Media
    </h3>

    <div className="grid gap-5 sm:grid-cols-2">
      <InputField type="number" label="Sort Order" onChange={(e)=>formData.sortOrder=Number(e.target.value)} defaultValue={formData.sortOrder || 0}/>
    </div>

    <InputField label="Thumbnail URL" placeholder="https://... or /uploads/..." onChange={(e)=>formData.thumbnailUrl=e.target.value} defaultValue={formData.thumbnailUrl}/>

    {/* Upload */}
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Upload Thumbnail</label>
      <Input
        type="file"
        accept="image/*"
        className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
        onChange={(e)=> thumbnailFile = e.target.files?.[0] || null}
      />

      {(formData.thumbnailUrl || existing?.thumbnailUrl) && (
        <div className="relative w-28 h-28 rounded-xl overflow-hidden border bg-slate-100">
          <Image
            src={resolveAttachmentUrl(formData.thumbnailUrl || existing?.thumbnailUrl || '', API_ORIGIN)}
            alt="Thumbnail preview"
            fill
            unoptimized
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  </div>

  {/* ---------------- ACTIONS ---------------- */}
  <div className="flex justify-between items-center pt-6 border-t border-slate-200/80">
    <Button variant="ghost" onClick={closeModal}>
      Cancel
    </Button>

    <Button
      className="px-6 h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-indigo-600"
      onClick={async () => {
        try {
          if (!formData.name?.trim()) throw new Error('Display name required');
          if (!formData.quote?.trim()) throw new Error('Quote required');

          const payload = new FormData();
          Object.entries({
            name: formData.name,
            quote: formData.quote,
            institute: formData.institute || '',
            info: formData.info,
            rating: formData.rating || 5,
            sortOrder: formData.sortOrder || 0,
            studentUserId: formData.studentUserId,
            courseId: formData.courseId,
            thumbnailUrl: formData.thumbnailUrl || ''
          }).forEach(([k,v]) => v && payload.append(k, String(v)));

          if (thumbnailFile) payload.append('thumbnail', thumbnailFile);

          if (existing) {
            await updateTestimonial(existing.id, payload);
          } else {
            await createAdminTestimonial(payload);
          }

          await load();
          toast({ title: existing ? 'Updated' : 'Created', variant: 'success' });
          closeModal();
        } catch (err) {
          toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        }
      }}
    >
      {existing ? 'Save Changes' : 'Publish Review'}
    </Button>
  </div>
</div>
      ),
    });
  };

  const approve = (id: string) => {
    openModal({
      title: 'Approve Testimonial',
      description: 'This will move the review to the public site immediately.',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Approve & Publish?"
          description="The student's feedback will be visible on the landing page and course details."
          variant="info"
          onConfirm={async () => {
            await approveTestimonial(id);
            await load();
            toast({ title: 'Successfully Published', variant: 'success' });
          }}
        />
      ),
    });
  };

  const remove = (id: string) => {
    openModal({
      title: 'Delete Testimonial',
      description: 'This action is permanent and cannot be reversed.',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Delete Permanently?"
          description="Are you sure you want to remove this student review?"
          variant="danger"
          onConfirm={async () => {
            await deleteTestimonial(id);
            await load();
            toast({ title: 'Deleted', variant: 'success' });
          }}
        />
      ),
    });
  };

  return (
    <div className="space-y-10 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/30">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-50/50" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-50/50" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            
            <div>
               <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">Student Testimonials</h1>
              
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {!sortMode && (
              <>
                <Button
                  className="h-14 px-8 rounded-2xl text-white bg-slate-900 font-black tracking-tight hover:bg-amber-500 transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
                  onClick={() => openForm()}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Manual Review
                </Button>
                <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 transition-all" onClick={load}>
                  <RefreshCw className={cn('h-5 w-5 text-slate-400', loading && 'animate-spin')} />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className={cn(
                'h-14 px-6 rounded-2xl font-black tracking-tight transition-all',
                sortMode
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
              onClick={() => {
                if (sortMode) setOrderedTestimonials(testimonials);
                setSortMode((s) => !s);
              }}
            >
              <GripVertical className="mr-2 h-5 w-5" />
              {sortMode ? 'Cancel' : 'Sort Order'}
            </Button>
            {sortMode && (
              <Button
                className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black tracking-tight hover:bg-indigo-700 transition-all shadow-lg"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? 'Saving…' : 'Save Order'}
              </Button>
            )}
          </div>
        </div>
      </div>



      {sortMode && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-4 flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-indigo-500 shrink-0" />
          <p className="text-sm font-bold text-indigo-700">
            Drag rows to reorder testimonials. Click <span className="font-black">Save Order</span> when done.
          </p>
        </div>
      )}

      {/* Filter Section */}
      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative min-w-70 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by student name, course or quote content…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 text-base font-bold text-slate-700 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
          
          <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-100">
             {[
               { id: 'all', label: 'All Reviews' },
               { id: 'published', label: 'Published' },
               { id: 'pending', label: 'Pending' },
             ].map((btn) => (
               <button
                 key={btn.id}
                 onClick={() => setFilterStatus(btn.id as 'all' | 'published' | 'pending')}
                 className={cn(
                   "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                   filterStatus === btn.id 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 {btn.label}
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-7">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Student Feedback Hub</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Real-time Public Feed
            </p>
          </div>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-black rounded-full px-4 py-1.5 border-0 text-[11px] tracking-tight">
            {loading ? 'Synchronizing…' : `${filteredTestimonials.length} Reviews Loaded`}
          </Badge>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
             <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-20" />
             <p className="text-sm font-black uppercase tracking-widest">Fetching social proof data</p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
             <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
             <p className="text-lg font-black text-slate-300">No reviews found in this view.</p>
             <p className="text-sm font-medium mt-1">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-50">
                  <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Student Profile</TableHead>
                  <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Academic Target</TableHead>
                  <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Testimonial Insight</TableHead>
                  <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Social Status</TableHead>
                  <TableHead className="h-14 px-8 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortMode ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedTestimonials.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {orderedTestimonials.map((t) => (
                        <SortableTestimonialRow key={t.id} testimonial={t} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  filteredTestimonials.map((t) => (
                  <TableRow key={t.id} className="group transition-all hover:bg-slate-50/50">
                    <TableCell className="py-8 px-8">
                       <div className="flex items-center gap-4">
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-4xl bg-linear-to-br from-indigo-50 to-white text-indigo-600 font-black text-base shadow-sm border border-indigo-100 transition-transform group-hover:scale-110 group-hover:rotate-3">
                                 {t.thumbnailUrl ? (
                                   <Image
                                     src={resolveAttachmentUrl(t.thumbnailUrl, API_ORIGIN)}
                                     alt={t.name || 'Review thumbnail'}
                                     fill
                                     unoptimized
                                     className="h-full w-full object-cover"
                                   />
                                 ) : (
                                   (t.student?.fullName || t.name || 'S').charAt(0)
                                 )}
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                               {t.student?.fullName || t.name || 'Student'}
                             </p>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <User className="h-3 w-3 text-slate-300" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {t.studentUserId?.slice(-8) || 'Manual'}</p>
                             </div>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-8 px-6">
                       <div className="space-y-1.5 max-w-50">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                             <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                             <span className="truncate">{t.course?.name || 'General Feedback'}</span>
                          </div>
                          {t.institute && (
                             <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider pl-5">{t.institute}</p>
                          )}
                          {t.info && (
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-5">{t.info}</p>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="py-8 px-6">
                       <div className="relative max-w-md">
                          <Quote className="absolute -left-4 -top-2 h-8 w-8 text-indigo-50/80 -z-10" />
                          <p className="text-sm font-medium leading-relaxed text-slate-600 italic line-clamp-2">
                              &ldquo;{t.quote}&rdquo;
                          </p>
                          <div className="flex items-center gap-0.5 mt-2">
                             {[...Array(5)].map((_, i) => (
                               <Star 
                                 key={i} 
                                 className={cn(
                                   "h-3 w-3", 
                                   i < (t.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                 )} 
                               />
                             ))}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-8 px-6">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all",
                        t.approved
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                          : 'border-amber-100 bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", t.approved ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {t.approved ? 'Published' : 'Awaiting Approval'}
                      </div>
                    </TableCell>
                    <TableCell className="py-8 px-8 text-right">
                      <div className="flex justify-end gap-2">
                        {!t.approved && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-lg transition-all border border-indigo-100/50"
                            onClick={() => approve(t.id)}
                            title="Approve Review"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all border border-transparent hover:border-indigo-100"
                          onClick={() => openForm(t)}
                          title="Edit Review"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all border border-transparent hover:border-rose-100"
                          title="Delete Review"
                          onClick={() => remove(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-900 transition-all border border-transparent"
                          title="View Insights"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="bg-slate-50/50 border-t border-slate-50 px-8 py-5 flex items-center justify-between">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Social proof engine synchronized
           </p>
           <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Verified Student Records Only
           </div>
        </div>
      </section>
    </div>
  );
}
