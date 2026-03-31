'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  updateTestimonial,
  type TestimonialAdmin,
} from '@/lib/api/testimonials';
import {
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Star,
  Search,
  Clock,
  CheckCircle,
  MoreVertical,
  Quote,
  Activity,
  User,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminTestimonialsPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [testimonials, setTestimonials] = useState<TestimonialAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'published'>('all');

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

  const stats = useMemo(() => {
    const total = testimonials.length;
    const pending = testimonials.filter((t) => !t.approved).length;
    const published = total - pending;
    const avgRating = total > 0 
      ? (testimonials.reduce((acc, t) => acc + (t.rating || 0), 0) / total).toFixed(1) 
      : '0.0';
    
    return { total, pending, published, avgRating };
  }, [testimonials]);

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
    let formData = existing 
      ? { ...existing } 
      : { name: '', quote: '', info: '', rating: 5, courseId: '', studentUserId: '' };

    openModal({
      title: existing ? 'Edit Testimonial' : 'Create Testimonial',
      description: 'Testimonials are tied to student enrollments and course IDs.',
      className: 'sm:max-w-2xl',
      content: (
        <div className="space-y-6 py-4">
          {!existing && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs font-bold text-indigo-700 leading-relaxed">
              <div className="flex gap-2 items-start">
                <Activity className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Manual entry requires valid Student & Course IDs. Backend validation ensures student is enrolled before allowing public visibility.</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Student User ID</label>
              <Input
                defaultValue={formData.studentUserId || ''}
                placeholder="e.g. user_2n..."
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                onChange={(e) => (formData.studentUserId = e.target.value)}
                disabled={!!existing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Course ID</label>
              <Input
                defaultValue={formData.courseId || ''}
                placeholder="e.g. course_8x..."
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                onChange={(e) => (formData.courseId = e.target.value)}
                disabled={!!existing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name (Override)</label>
              <Input 
                defaultValue={formData.name || ''} 
                placeholder="Student's name" 
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                onChange={(e) => (formData.name = e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Batch / Info</label>
              <Input 
                defaultValue={formData.info || ''} 
                placeholder="e.g. HSC 2024 Batch" 
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                onChange={(e) => (formData.info = e.target.value)} 
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Star Rating (1-5)</label>
              <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 rounded-xl px-4 h-12">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button 
                    key={star} 
                    type="button"
                    onClick={() => {
                      formData.rating = star;
                      // Force a re-render if needed, but since it's a modal with internal state tracking
                      // this is a bit tricky without a proper component. Using defaultValue/onChange for simplicity here.
                      // In a real refactor, we'd make this a proper sub-component.
                    }}
                    className="hover:scale-110 transition-transform"
                   >
                     <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                   </button>
                 ))}
                 <span className="ml-auto font-black text-slate-900">Recommended: 5</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">The Testimonial Quote</label>
            <Textarea 
              defaultValue={formData.quote} 
              placeholder="What did the student say?" 
              className="rounded-2xl border-slate-100 bg-slate-50/50 font-medium leading-relaxed min-h-[120px]"
              onChange={(e) => (formData.quote = e.target.value)} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" className="h-12 rounded-xl font-bold" onClick={closeModal}>Cancel</Button>
            <Button
              className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black hover:bg-indigo-600 shadow-lg shadow-slate-200"
              onClick={async () => {
                try {
                  if (!formData.studentUserId || !formData.courseId) throw new Error('Student ID and course ID are required');
                  if (!formData.quote?.trim()) throw new Error('Quote is required');
                  
                  if (existing) await updateTestimonial(existing.id, formData);
                  else await createTestimonial(formData);
                  
                  await load();
                  toast({ title: existing ? 'Review Updated' : 'Review Created', variant: 'success' });
                  closeModal();
                } catch (err) {
                  toast({ title: 'Save failed', description: (err as Error).message, variant: 'destructive' });
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
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm border border-amber-100/50">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              Social Proof
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">Student Testimonials</h1>
               <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-slate-500">
                 Manage student feedback and public reviews. Approved testimonials appear on your 
                 homepage and increase conversion rates for prospective students.
               </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
         {[
            { label: 'Total Reviews', value: stats.total, icon: MessageSquare, gradient: 'from-indigo-600 to-indigo-500', trend: 'Global Feed' },
            { label: 'Avg. Rating', value: stats.avgRating, icon: Star, gradient: 'from-amber-500 to-amber-400', trend: 'Satisfaction' },
            { label: 'Published', value: stats.published, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-400', trend: 'Live Status' },
            { label: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-rose-500 to-rose-400', trend: 'Awaiting Action' },
         ].map((kpi) => {
            const Icon = kpi.icon;
            return (
               <div key={kpi.label} className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100">
                  <div className="flex items-center justify-between">
                     <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110", kpi.gradient)}>
                        <Icon className="h-6 w-6" />
                     </div>
                     <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                        {kpi.trend}
                     </div>
                  </div>

                  <div className="mt-8">
                     <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                     <h3 className="mt-1 text-4xl font-black text-slate-900">{loading ? '—' : kpi.value}</h3>
                  </div>
                  
                  <div className="mt-6 flex items-end gap-1 h-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     {[40, 70, 45, 90, 65, 80, 50, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm bg-indigo-500" style={{ height: `${h}%` }} />
                     ))}
                  </div>
               </div>
            );
         })}
      </section>

      {/* Filter Section */}
      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative min-w-[280px] flex-1">
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
                 onClick={() => setFilterStatus(btn.id as any)}
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
                {filteredTestimonials.map((t) => (
                  <TableRow key={t.id} className="group transition-all hover:bg-slate-50/50">
                    <TableCell className="py-8 px-8">
                       <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-indigo-50 to-white text-indigo-600 font-black text-base shadow-sm border border-indigo-100 transition-transform group-hover:scale-110 group-hover:rotate-3">
                             {(t.student?.fullName || t.name || 'S').charAt(0)}
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
                       <div className="space-y-1.5 max-w-[200px]">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                             <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                             <span className="truncate">{t.course?.name || 'General Feedback'}</span>
                          </div>
                          {t.info && (
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-5">{t.info}</p>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="py-8 px-6">
                       <div className="relative max-w-md">
                          <Quote className="absolute -left-4 -top-2 h-8 w-8 text-indigo-50/80 -z-10" />
                          <p className="text-sm font-medium leading-relaxed text-slate-600 italic line-clamp-2">
                             "{t.quote}"
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
                ))}
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
