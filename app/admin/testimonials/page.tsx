'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Pencil, Plus, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

export default function AdminTestimonialsPage() {
  const { toast, toasts, removeToast } = useToast();
  const { openModal } = useModalStore();
  const [testimonials, setTestimonials] = useState<TestimonialAdmin[]>([]);
  const [loading, setLoading] = useState(true);

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

  const openForm = (existing?: TestimonialAdmin) => {
    const initial =
      existing ||
      ({
        name: '',
        quote: '',
        info: '',
        rating: 5,
        courseId: '',
        studentUserId: '',
      } as Partial<TestimonialAdmin>);
    let form = { ...initial };
    openModal({
      title: existing ? 'Edit review' : 'Add review',
      className: 'sm:max-w-lg',
      content: (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs font-semibold text-indigo-700">
            Reviews can only be submitted by enrolled students. Enter the student ID and course ID; backend will verify enrollment and keep the review pending until approved.
          </div>
          <Input
            defaultValue={form.studentUserId || ''}
            placeholder="Student user ID (required)"
            onChange={(e) => (form = { ...form, studentUserId: e.target.value })}
          />
          <Input
            defaultValue={form.courseId || ''}
            placeholder="Course ID (required)"
            onChange={(e) => (form = { ...form, courseId: e.target.value })}
          />
          <Input defaultValue={form.name} placeholder="Display name (optional)" onChange={(e) => (form = { ...form, name: e.target.value })} />
          <Input defaultValue={form.info || ''} placeholder="Institute / batch (optional)" onChange={(e) => (form = { ...form, info: e.target.value })} />
          <Input
            type="number"
            min={1}
            max={5}
            defaultValue={form.rating || 5}
            placeholder="Rating 1-5"
            onChange={(e) => (form = { ...form, rating: Number(e.target.value) })}
          />
          <Textarea defaultValue={form.quote} placeholder="Quote" rows={4} onChange={(e) => (form = { ...form, quote: e.target.value })} />
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  if (!form.studentUserId || !form.courseId) throw new Error('Student ID and course ID are required');
                  if (!form.quote?.trim()) throw new Error('Quote is required');
                  if (existing) await updateTestimonial(existing.id, form);
                  else await createTestimonial(form);
                  await load();
                  toast({ title: existing ? 'Updated' : 'Created', variant: 'success' });
                } catch (err) {
                  toast({ title: 'Save failed', description: (err as Error).message, variant: 'destructive' });
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      ),
    });
  };

  const approve = (id: string) => {
    openModal({
      title: 'Approve review',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Publish review?"
          description="This testimonial will show on the public site."
          variant="info"
          onConfirm={async () => {
            await approveTestimonial(id);
            await load();
            toast({ title: 'Approved', variant: 'success' });
          }}
        />
      ),
    });
  };

  const remove = (id: string) => {
    openModal({
      title: 'Delete review',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Delete permanently?"
          description="This cannot be undone."
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
    <div className="space-y-6 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-500">Reviews</p>
          <h1 className="text-2xl font-black">Student testimonials</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" /> Add review
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-bold">
                  <div className="flex flex-col">
                    <span>{t.student?.fullName || t.name || 'Student'}</span>
                    <span className="text-xs text-slate-400">{t.studentUserId || '—'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{t.course?.name || '—'}</span>
                    <span className="text-xs text-slate-400">{t.courseId || t.course?.id || ''}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xl">
                  <p className="text-sm text-slate-700 line-clamp-2">{t.quote}</p>
                  {t.info && <p className="text-xs text-slate-400 mt-1">{t.info}</p>}
                </TableCell>
                <TableCell>{t.rating || '—'}</TableCell>
                <TableCell>
                  {t.approved ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 text-amber-600">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!t.approved && (
                    <Button size="sm" variant="ghost" onClick={() => approve(t.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openForm(t)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {testimonials.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500 py-10">
                  No testimonials yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
