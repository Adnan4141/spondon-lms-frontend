'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  MessageSquare,
  Pin,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toast';
import { ConfirmationModal } from '@/features/admin/shared';
import { CommunityPostCard } from '@/features/community/components/CommunityPostCard';
import { DoubtCard } from '@/features/community/components/DoubtCard';
import { formatTimeAgo, initials } from '@/features/community/components/community-utils';
import { useToast } from '@/hooks/use-toast';
import {
  addCommunityMember,
  deleteCommunityPost,
  getCommunityById,
  getCommunityMembers,
  getCommunityPosts,
  removeCommunityMember,
  updateCommunityMember,
  updateCommunityPost,
  type Community,
  type CommunityMember,
  type CommunityPost,
} from '@/lib/api/community';
import { getDoubtThreads, updateDoubtThread, type DoubtThread } from '@/lib/api/doubts';
import { getStudents, type Student } from '@/lib/api/students';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/store/modalStore';

type DetailTab = 'overview' | 'posts' | 'members' | 'doubts';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [doubts, setDoubts] = useState<DoubtThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [search, setSearch] = useState('');
  const [postStatus, setPostStatus] = useState('all');
  const [doubtStatus, setDoubtStatus] = useState('all');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const communityRes = await getCommunityById(id);
      if (!communityRes.success || !communityRes.data) throw new Error(communityRes.message || 'Community not found');
      const nextCommunity = communityRes.data;
      setCommunity(nextCommunity);

      const [memberRes, postRes, doubtRes] = await Promise.all([
        getCommunityMembers(id),
        getCommunityPosts({ communityId: id, status: postStatus === 'all' ? undefined : postStatus, search: search || undefined }),
        getDoubtThreads({
          courseId: nextCommunity.courseId || undefined,
          status: doubtStatus === 'all' ? undefined : doubtStatus,
          search: search || undefined,
        }),
      ]);
      if (memberRes.success && memberRes.data) setMembers(memberRes.data);
      if (postRes.success && postRes.data) setPosts(postRes.data);
      if (doubtRes.success && doubtRes.data) setDoubts(doubtRes.data);
    } catch (error) {
      toast({ title: 'Failed to load community', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [doubtStatus, id, postStatus, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase();
    return members.filter((member) => {
      if (!query) return true;
      return (
        member.user?.fullName?.toLowerCase().includes(query) ||
        member.user?.email?.toLowerCase().includes(query) ||
        member.user?.mobile?.includes(search)
      );
    });
  }, [members, search]);

  const stats = useMemo(() => {
    const moderators = members.filter((member) => member.role === 'MODERATOR').length;
    const pinned = posts.filter((post) => post.isPinned).length;
    const openDoubts = doubts.filter((doubt) => doubt.status === 'OPEN').length;
    return { moderators, pinned, openDoubts };
  }, [doubts, members, posts]);

  const openAddMember = () => {
    openModal({
      title: 'Add Member',
      description: 'Invite a student into this community and assign their role.',
      className: 'sm:max-w-7xl',
      content: <AddMemberForm communityId={id} onClose={closeModal} onSuccess={load} />,
    });
  };

  const confirmRemoveMember = (member: CommunityMember) => {
    openModal({
      title: 'Remove Member',
      description: `Remove ${member.user?.fullName || 'this member'} from the community?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm removal"
          description="The member will lose access to members-only discussions until added again."
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const res = await removeCommunityMember(member.id);
            if (!res.success) throw new Error(res.message);
            toast({ title: 'Member removed' });
            load();
          }}
        />
      ),
    });
  };

  const confirmDeletePost = (post: CommunityPost) => {
    openModal({
      title: 'Delete Post',
      description: `Delete "${post.title}" permanently?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm delete"
          description="Use hide for normal moderation. Delete is permanent and should be used only for spam or invalid content."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const res = await deleteCommunityPost(post.id);
            if (!res.success) throw new Error(res.message);
            toast({ title: 'Post deleted' });
            load();
          }}
        />
      ),
    });
  };

  const updatePost = async (post: CommunityPost, patch: Parameters<typeof updateCommunityPost>[1]) => {
    const res = await updateCommunityPost(post.id, patch);
    if (!res.success) return toast({ title: 'Post update failed', description: res.message, variant: 'destructive' });
    toast({ title: 'Post updated' });
    load();
  };

  const updateDoubt = async (thread: DoubtThread, status: string) => {
    const res = await updateDoubtThread(thread.id, { status });
    if (!res.success) return toast({ title: 'Doubt update failed', description: res.message, variant: 'destructive' });
    toast({ title: status === 'OPEN' ? 'Doubt reopened' : 'Doubt resolved' });
    load();
  };

  const toggleMemberRole = async (member: CommunityMember) => {
    const role = member.role === 'MODERATOR' ? 'MEMBER' : 'MODERATOR';
    const res = await updateCommunityMember(member.id, { role });
    if (!res.success) return toast({ title: 'Role update failed', description: res.message, variant: 'destructive' });
    toast({ title: role === 'MODERATOR' ? 'Moderator promoted' : 'Moderator demoted' });
    load();
  };

  if (loading && !community) {
    return <div className="p-6 text-center text-slate-500">Loading community workspace...</div>;
  }

  if (!community) {
    return <div className="p-6 text-center text-rose-600">Community not found.</div>;
  }

  return (
    <div className={cn('mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 sm:px-6 lg:px-8')}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-linear-to-r from-sky-100 via-white to-emerald-100 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Button variant="ghost" className="-ml-3 mb-3 gap-2" onClick={() => router.push('/admin/communities')}>
                <ArrowLeft className="h-4 w-4" />
                Back to hub
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={community.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}>{community.status}</Badge>
                <Badge className="bg-sky-50 text-sky-700">{community.visibility.replace('_', ' ')}</Badge>
                {community.course?.name ? <Badge variant="outline">{community.course.name}</Badge> : null}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{community.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{community.description || 'No description has been added yet.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button onClick={openAddMember} className="bg-slate-900">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Members" value={members.length} icon={Users} tone="sky" />
          <Kpi label="Moderators" value={stats.moderators} icon={Shield} tone="violet" />
          <Kpi label="Posts" value={posts.length} icon={MessageSquare} tone="emerald" />
          <Kpi label="Pinned" value={stats.pinned} icon={Pin} tone="amber" />
          <Kpi label="Open doubts" value={stats.openDoubts} icon={BookOpen} tone="rose" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DetailTab)} className="w-full gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
            <TabsList className="h-auto w-full justify-start rounded-xl bg-slate-100 p-1 xl:w-auto">
              <TabsTrigger value="overview" className="rounded-lg px-4 py-2">Overview</TabsTrigger>
              <TabsTrigger value="posts" className="rounded-lg px-4 py-2">Posts</TabsTrigger>
              <TabsTrigger value="members" className="rounded-lg px-4 py-2">Members</TabsTrigger>
              <TabsTrigger value="doubts" className="rounded-lg px-4 py-2">Doubts</TabsTrigger>
            </TabsList>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts, members, or doubts..." className="pl-9" />
            </div>
            {activeTab === 'posts' ? (
              <Select value={postStatus} onValueChange={setPostStatus}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All posts</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            {activeTab === 'doubts' ? (
              <Select value={doubtStatus} onValueChange={setDoubtStatus}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All doubts</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </CardContent>
        </Card>

        <TabsContent value="overview" className="mt-0 w-full">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-black text-slate-950">Moderation snapshot</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <SummaryTile label="Needs review" value={posts.filter((post) => post.status === 'HIDDEN' || post.status === 'DRAFT').length} />
                  <SummaryTile label="Resolved doubts" value={doubts.filter((doubt) => doubt.status === 'RESOLVED').length} />
                  <SummaryTile label="Visibility" value={community.visibility.replace('_', ' ')} />
                </div>
                <div className="mt-6 space-y-3">
                  <h3 className="font-black text-slate-900">Latest posts</h3>
                  {posts.slice(0, 3).map((post) => (
                    <CompactRow key={post.id} title={post.title} meta={`${post.author?.fullName || 'Unknown'} · ${formatTimeAgo(post.createdAt)}`} />
                  ))}
                  {posts.length === 0 ? <EmptyState title="No posts yet" /> : null}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-black text-slate-950">Doubt health</h2>
                <div className="mt-5 space-y-3">
                  {doubts.slice(0, 5).map((doubt) => (
                    <CompactRow key={doubt.id} title={doubt.title} meta={`${doubt.status} · ${doubt._count?.replies || 0} replies`} />
                  ))}
                  {doubts.length === 0 ? <EmptyState title="No linked doubts" /> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-0 w-full">
          <div className="grid gap-4 xl:grid-cols-2">
            {posts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                adminActions={
                  <PostActions
                    post={post}
                    onPatch={(patch) => updatePost(post, patch)}
                    onDelete={() => confirmDeletePost(post)}
                  />
                }
              />
            ))}
            {posts.length === 0 ? <EmptyState title="No posts match this filter" /> : null}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-0 w-full">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-violet-500 text-sm font-black text-white">
                      {initials(member.user?.fullName || 'M')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-950">{member.user?.fullName || 'Unknown member'}</h3>
                      <p className="truncate text-xs text-slate-500">{member.user?.email || member.user?.mobile || 'No contact'}</p>
                    </div>
                  </div>
                  <Badge className={member.role === 'MODERATOR' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-700'}>
                    {member.role}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleMemberRole(member)}>
                    <Shield className="mr-2 h-4 w-4" />
                    {member.role === 'MODERATOR' ? 'Make Member' : 'Make Moderator'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-rose-600" onClick={() => confirmRemoveMember(member)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </article>
            ))}
            {filteredMembers.length === 0 ? <EmptyState title="No members found" /> : null}
          </div>
        </TabsContent>

        <TabsContent value="doubts" className="mt-0 w-full">
          <div className="grid gap-4 xl:grid-cols-2">
            {doubts.map((doubt) => (
              <DoubtCard
                key={doubt.id}
                thread={doubt}
                actions={<DoubtActions thread={doubt} onStatus={(next) => updateDoubt(doubt, next)} />}
              />
            ))}
            {doubts.length === 0 ? <EmptyState title="No doubts match this filter" /> : null}
          </div>
        </TabsContent>
      </Tabs>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function AddMemberForm({ communityId, onSuccess, onClose }: { communityId: string; onSuccess: () => void; onClose: () => void }) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudents({ role: 'STUDENT', limit: 100 }).then((res) => {
      if (res.success && res.data) setStudents(res.data);
    }).catch(() => {});
  }, []);

  const filtered = students.filter((student) => {
    const q = query.toLowerCase();
    return !q || student.fullName.toLowerCase().includes(q) || student.mobile?.includes(query);
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) return toast({ title: 'Select a student first', variant: 'destructive' });
    setSaving(true);
    try {
      const res = await addCommunityMember({ communityId, userId: selectedUserId, role });
      if (!res.success) throw new Error(res.message);
      toast({ title: 'Member added' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Could not add member', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={cn('mx-auto flex w-full max-w-full flex-col space-y-5 px-1')}>
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-sky-50 via-white to-violet-50 p-4 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Member access</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Add community member</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">Search students, select the member, and choose whether they should join as a regular member or moderator.</p>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search student by name or mobile"
        className="h-11 rounded-xl border-slate-200"
      />
      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
        <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select student" /></SelectTrigger>
        <SelectContent>
          {filtered.map((student) => (
            <SelectItem key={student.id} value={student.id}>{student.fullName} {student.mobile ? `(${student.mobile})` : ''}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="MEMBER">Member</SelectItem>
          <SelectItem value="MODERATOR">Moderator</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
        <Button disabled={saving} className="rounded-xl bg-slate-950 text-white hover:bg-slate-800">{saving ? 'Adding...' : 'Add member'}</Button>
      </div>
    </form>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: ComponentType<{ className?: string }>; tone: string }) {
  const tones: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className={cn('mb-3 inline-flex rounded-lg p-2', tones[tone])}><Icon className="h-4 w-4" /></div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function PostActions({ post, onPatch, onDelete }: { post: CommunityPost; onPatch: (patch: Parameters<typeof updateCommunityPost>[1]) => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button size="sm" variant="outline" onClick={() => onPatch({ isPinned: !post.isPinned })}>
        <Pin className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => onPatch({ status: post.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN' })}>
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        {post.status === 'HIDDEN' ? 'Publish' : 'Hide'}
      </Button>
      <Button size="sm" variant="outline" className="text-rose-600" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function DoubtActions({ thread, onStatus }: { thread: DoubtThread; onStatus: (status: string) => void }) {
  return (
    <Button size="sm" variant="outline" onClick={() => onStatus(thread.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')}>
      <CheckCircle2 className="mr-2 h-4 w-4" />
      {thread.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}
    </Button>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function CompactRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="line-clamp-1 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{meta}</p>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-black text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">Try changing filters or refreshing the workspace.</p>
    </div>
  );
}
