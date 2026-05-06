'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ImageIcon, LinkIcon, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createCommunity, updateCommunity, type Community } from '@/lib/api/community';
import { getCourses, type Course } from '@/lib/api/courses';
import { cn } from '@/lib/utils';
import { getErrorMessage, slugifyCommunityName } from './community-admin-utils';

type CommunityFormState = {
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  courseId: string;
  visibility: Community['visibility'];
  status: Community['status'];
};

export function CommunityForm({
  community,
  createdById,
  onSuccess,
  onClose,
}: {
  community?: Community;
  createdById?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CommunityFormState>({
    name: community?.name || '',
    slug: community?.slug || '',
    description: community?.description || '',
    thumbnail: community?.thumbnail || '',
    courseId: community?.courseId || 'none',
    visibility: community?.visibility || 'PUBLIC',
    status: community?.status || 'ACTIVE',
  });

  useEffect(() => {
    getCourses({ all: true })
      .then((response) => response.success && response.data && setCourses(response.data))
      .catch(() => {});
  }, []);

  const set = <K extends keyof CommunityFormState>(key: K, value: CommunityFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'Name and slug are required', variant: 'destructive' });
      return;
    }
    if (!community && !createdById) {
      toast({ title: 'Admin session missing', description: 'Please refresh and try again.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        courseId: form.courseId === 'none' ? undefined : form.courseId,
      };
      const response = community
        ? await updateCommunity(community.id, payload)
        : await createCommunity({ ...payload, createdById: createdById! });
      if (!response.success) throw new Error(response.message);
      toast({ title: community ? 'Community updated' : 'Community created' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Save failed', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={cn('mx-auto flex w-full max-w-full flex-col space-y-5 px-1')}>
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-cyan-50 via-white to-emerald-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">{community ? 'Edit space' : 'New space'}</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Community setup</h3>
        <p className="mt-1 text-sm text-slate-600">Keep names searchable and link course-specific groups when moderation depends on enrollment.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Name</span>
          <Input value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="HSC Physics Doubt Lab" className="h-11 rounded-xl" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Slug</span>
          <div className="flex gap-2">
            <Input value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="hsc-physics-doubt-lab" className="h-11 rounded-xl" />
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => set('slug', slugifyCommunityName(form.name))}>
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Description</span>
        <textarea
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          placeholder="What should students use this community for?"
          className="min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Thumbnail URL</span>
        <div className="relative">
          <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={form.thumbnail} onChange={(event) => set('thumbnail', event.target.value)} placeholder="https://... or /images/..." className="h-11 rounded-xl pl-9" />
        </div>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Course</span>
          <Select value={form.courseId} onValueChange={(courseId) => set('courseId', courseId)}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No course</SelectItem>
              {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Visibility</span>
          <Select value={form.visibility} onValueChange={(visibility: Community['visibility']) => set('visibility', visibility)}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="COURSE_ONLY">Course only</SelectItem>
              <SelectItem value="MEMBERS_ONLY">Members only</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Status</span>
          <Select value={form.status} onValueChange={(status: Community['status']) => set('status', status)}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
        <LinkIcon className="h-4 w-4 text-cyan-600" />
        Student posts support file upload and link attachments from the community feed.
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
        <Button disabled={saving} className={cn('rounded-xl bg-slate-950 text-white hover:bg-slate-800', saving && 'opacity-80')}>
          {saving ? 'Saving...' : 'Save community'}
        </Button>
      </div>
    </form>
  );
}
