'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toast';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { CommunityAdminFilters } from '@/features/admin/communities/components/CommunityAdminFilters';
import { CommunityAdminHero } from '@/features/admin/communities/components/CommunityAdminHero';
import { CommunityCard } from '@/features/admin/communities/components/CommunityCard';
import { CommunityEmptyState } from '@/features/admin/communities/components/CommunityEmptyState';
import { CommunityForm } from '@/features/admin/communities/components/CommunityForm';
import { CommunityKpiGrid } from '@/features/admin/communities/components/CommunityKpiGrid';
import { CommunityPostCard } from '@/features/community/components/CommunityPostCard';
import { DoubtCard } from '@/features/community/components/DoubtCard';
import { formatTimeAgo, initials } from '@/features/community/components/community-utils';
import { getErrorMessage } from '@/features/admin/communities/components/community-admin-utils';
import { useToast } from '@/hooks/use-toast';
import {
  createCommunityReply,
  createCommunityVote,
  deleteCommunityVote,
  deleteCommunity,
  getCommunities,
  getCommunityPosts,
  seedDemoCommunities,
  updateCommunity,
  updateCommunityPost,
  type Community,
  type CommunityPost,
} from '@/lib/api/community';
import {
  createDoubtReply,
  getDoubtReplies,
  getDoubtThreads,
  updateDoubtThread,
  type DoubtReply,
  type DoubtThread,
} from '@/lib/api/doubts';
import { getCourses, type Course } from '@/lib/api/courses';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/store/modalStore';

type AdminCommunitiesTab = 'spaces' | 'posts' | 'doubts';

export default function AdminCommunitiesPage() {
  const router = useRouter();
  const { user } = useAdminSession();
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [doubts, setDoubts] = useState<DoubtThread[]>([]);
  const [courses, setCourses] = useState<Array<Pick<Course, 'id' | 'name'>>>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [doubtCourseId, setDoubtCourseId] = useState('all');
  const [doubtStatus, setDoubtStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AdminCommunitiesTab>('spaces');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postReplyBody, setPostReplyBody] = useState('');
  const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
  const [doubtReplyBody, setDoubtReplyBody] = useState('');
  const [doubtReplies, setDoubtReplies] = useState<Record<string, DoubtReply[]>>({});
  const [interactionSubmitting, setInteractionSubmitting] = useState(false);
  const pageSize = 6;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [communityRes, postRes, doubtRes] = await Promise.all([
        getCommunities(),
        getCommunityPosts(),
        getDoubtThreads({
          courseId: doubtCourseId !== 'all' && doubtCourseId !== 'unassigned' ? doubtCourseId : undefined,
          status: doubtStatus !== 'all' ? doubtStatus : undefined,
          search: activeTab === 'doubts' ? search || undefined : undefined,
        }),
      ]);
      if (communityRes.success && communityRes.data) setCommunities(communityRes.data);
      if (postRes.success && postRes.data) setPosts(postRes.data);
      if (doubtRes.success && doubtRes.data) setDoubts(doubtRes.data);
    } catch (error) {
      toast({ title: 'Failed to load', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, doubtCourseId, doubtStatus, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getCourses({ all: true }).then((response) => {
      if (response.success && response.data) {
        setCourses(response.data.map((course) => ({ id: course.id, name: course.name })));
      }
    }).catch(() => {});
  }, []);

  const filteredCommunities = useMemo(() => {
    const query = search.toLowerCase().trim();
    return communities.filter((community) => {
      const matchesSearch =
        !query ||
        community.name.toLowerCase().includes(query) ||
        community.slug.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query) ||
        community.course?.name?.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || community.status === status;
      const matchesVisibility = visibility === 'all' || community.visibility === visibility;
      return matchesSearch && matchesStatus && matchesVisibility;
    });
  }, [communities, search, status, visibility]);

  const filteredPosts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return posts.filter((post) => {
      if (!query) return true;
      return [
        post.title,
        post.body,
        post.author?.fullName,
        post.community?.name,
        post.status,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [posts, search]);

  const filteredDoubts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return doubts.filter((thread) => {
      if (doubtCourseId === 'unassigned' && thread.courseId) return false;
      if (!query) return true;
      return [
        thread.title,
        thread.body,
        thread.student?.fullName,
        thread.course?.name,
        thread.status,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [doubtCourseId, doubts, search]);

  const doubtCourseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    doubts.forEach((thread) => {
      counts.set(thread.courseId || 'unassigned', (counts.get(thread.courseId || 'unassigned') || 0) + 1);
    });
    return counts;
  }, [doubts]);

  const doubtStatusCounts = useMemo(() => {
    return filteredDoubts.reduce(
      (acc, thread) => {
        if (thread.status === 'RESOLVED') acc.resolved += 1;
        else if (thread.status === 'CLOSED') acc.closed += 1;
        else acc.open += 1;
        return acc;
      },
      { open: 0, resolved: 0, closed: 0 },
    );
  }, [filteredDoubts]);

  const totalPages = Math.max(1, Math.ceil(filteredCommunities.length / pageSize));
  const paginatedCommunities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCommunities.slice(start, start + pageSize);
  }, [filteredCommunities, page]);
  const pageNumbers = useMemo(() => {
    const items = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    return Array.from(items)
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((left, right) => left - right);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, status, visibility, doubtCourseId, doubtStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openForm = (community?: Community) => {
    openModal({
      title: community ? 'Edit Community' : 'Create Community',
      description: community ? 'Update visibility, course link, and public profile.' : 'Create a polished discussion space for students.',
      className: 'sm:max-w-7xl',
      content: <CommunityForm createdById={user?.id} community={community} onSuccess={load} onClose={closeModal} />,
    });
  };

  const confirmDelete = (community: Community) => {
    openModal({
      title: 'Delete Community',
      description: `Delete "${community.name}"?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm delete"
          description="This permanently removes the community, memberships, and linked community posts. Archive it instead if you only want to hide it."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const response = await deleteCommunity(community.id);
            if (!response.success) throw new Error(response.message);
            toast({ title: 'Community deleted' });
            load();
          }}
        />
      ),
    });
  };

  const toggleCommunityStatus = async (community: Community) => {
    try {
      const nextStatus = community.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      const response = await updateCommunity(community.id, { status: nextStatus });
      if (!response.success) throw new Error(response.message);
      toast({ title: nextStatus === 'ACTIVE' ? 'Community activated' : 'Community archived' });
      load();
    } catch (error) {
      toast({ title: 'Status update failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const moderatePost = async (post: CommunityPost, patch: Partial<CommunityPost>) => {
    try {
      const response = await updateCommunityPost(post.id, patch as Parameters<typeof updateCommunityPost>[1]);
      if (!response.success) throw new Error(response.message);
      toast({ title: 'Post updated' });
      load();
    } catch (error) {
      toast({ title: 'Post update failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const moderateDoubt = async (thread: DoubtThread, nextStatus: string) => {
    try {
      const response = await updateDoubtThread(thread.id, { status: nextStatus });
      if (!response.success) throw new Error(response.message);
      toast({ title: nextStatus === 'OPEN' ? 'Doubt reopened' : 'Doubt resolved' });
      load();
    } catch (error) {
      toast({ title: 'Doubt update failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const requireActorId = () => {
    if (user?.id) return user.id;
    toast({ title: 'Session missing', description: 'Reload the page and sign in again to interact with posts or doubts.', variant: 'destructive' });
    return null;
  };

  const handleLike = async (post: CommunityPost) => {
    const actorId = requireActorId();
    if (!actorId) return;

    const liked = post.votes?.some((vote) => vote.userId === actorId && vote.value === 1);
    const snapshot = posts;

    setPosts((prev) => prev.map((row) => (
      row.id === post.id
        ? {
            ...row,
            votes: liked
              ? row.votes?.filter((vote) => vote.userId !== actorId)
              : [...(row.votes || []), { id: `optimistic-${Date.now()}`, postId: row.id, userId: actorId, value: 1 }],
          }
        : row
    )));

    try {
      const response = liked
        ? await deleteCommunityVote(post.id, actorId)
        : await createCommunityVote({ postId: post.id, userId: actorId, value: 1 });
      if (!response.success) throw new Error(response.message);
    } catch (error) {
      setPosts(snapshot);
      toast({ title: 'Appreciation failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const togglePostReply = (post: CommunityPost) => {
    setExpandedPostId((current) => current === post.id ? null : post.id);
    setPostReplyBody('');
  };

  const handlePostReply = async (postId: string) => {
    const actorId = requireActorId();
    if (!actorId || !postReplyBody.trim()) return;

    setInteractionSubmitting(true);
    try {
      const response = await createCommunityReply({ postId, authorId: actorId, body: postReplyBody.trim() });
      if (!response.success) throw new Error(response.message);
      setPostReplyBody('');
      setExpandedPostId(null);
      await load();
      toast({ title: 'Reply posted' });
    } catch (error) {
      toast({ title: 'Reply failed', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setInteractionSubmitting(false);
    }
  };

  const toggleDoubtReplies = async (threadId: string) => {
    const nextThreadId = expandedDoubtId === threadId ? null : threadId;
    setExpandedDoubtId(nextThreadId);
    setDoubtReplyBody('');

    if (nextThreadId && !doubtReplies[nextThreadId]) {
      try {
        const response = await getDoubtReplies(nextThreadId);
        if (!response.success) throw new Error(response.message);
        setDoubtReplies((prev) => ({ ...prev, [nextThreadId]: response.data || [] }));
      } catch (error) {
        toast({ title: 'Replies failed', description: getErrorMessage(error), variant: 'destructive' });
      }
    }
  };

  const handleDoubtReply = async (threadId: string) => {
    const actorId = requireActorId();
    if (!actorId || !doubtReplyBody.trim()) return;

    setInteractionSubmitting(true);
    try {
      const response = await createDoubtReply({ threadId, authorUserId: actorId, body: doubtReplyBody.trim() });
      if (!response.success) throw new Error(response.message);
      const replyResponse = await getDoubtReplies(threadId);
      if (!replyResponse.success) throw new Error(replyResponse.message);
      setDoubtReplies((prev) => ({ ...prev, [threadId]: replyResponse.data || [] }));
      setDoubtReplyBody('');
      await load();
      toast({ title: 'Reply posted' });
    } catch (error) {
      toast({ title: 'Reply failed', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setInteractionSubmitting(false);
    }
  };

  const seedCommunities = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoCommunities(user?.id);
      if (!response.success) throw new Error(response.message);
      toast({
        title: 'Demo communities seeded',
        description: response.message || 'Sample communities, posts, members, and doubts are ready.',
      });
      load();
    } catch (error) {
      toast({ title: 'Seed failed', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className={cn('mx-auto w-full max-w-full space-y-6 px-4 pb-10 sm:px-4 lg:px-0')}>
      <CommunityAdminHero
        loading={loading}
        seeding={seeding}
        onRefresh={load}
        onCreate={() => openForm()}
        onSeed={seedCommunities}
      />

      <CommunityKpiGrid communities={communities} posts={posts} doubts={doubts} />

      <CommunityAdminFilters
        search={search}
        status={status}
        visibility={visibility}
        onSearch={setSearch}
        onStatus={setStatus}
        onVisibility={setVisibility}
        courses={courses.map((course) => ({
          ...course,
          name: `${course.name}${doubtCourseCounts.get(course.id) ? ` (${doubtCourseCounts.get(course.id)})` : ''}`,
        }))}
        doubtCourseId={doubtCourseId}
        doubtStatus={doubtStatus}
        showDoubtCourse={activeTab === 'doubts'}
        onDoubtCourse={setDoubtCourseId}
        onDoubtStatus={setDoubtStatus}
      />

      <p className="px-1 text-xs font-medium text-slate-500">
        Community posts are moderated separately from course Q&A. The course and Q&A status filters appear on the Doubts tab.
      </p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminCommunitiesTab)} className="w-full gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="spaces" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              Community spaces
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                {filteredCommunities.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              Posts
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                {filteredPosts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="doubts" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              Doubts
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                {filteredDoubts.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="spaces" className="mt-0 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Community spaces</h2>
              <p className="text-sm font-medium text-slate-500">{filteredCommunities.length} spaces match the current filters.</p>
            </div>
          </div>

          {filteredCommunities.length ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {paginatedCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onOpen={() => router.push(`/admin/communities/${community.id}`)}
                    onEdit={() => openForm(community)}
                    onToggleStatus={() => toggleCommunityStatus(community)}
                    onDelete={() => confirmDelete(community)}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(filteredCommunities.length, page * pageSize)} of {filteredCommunities.length} communities
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={loading || page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                      className="h-8"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </Button>
                    {pageNumbers.map((value, index) => {
                      const previous = pageNumbers[index - 1];
                      const hasGap = previous && value - previous > 1;
                      return (
                        <span key={value} className="flex items-center gap-1">
                          {hasGap ? <span className="px-1.5 text-xs text-slate-400">...</span> : null}
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => setPage(value)}
                            className={cn(
                              'h-8 min-w-8 rounded-lg border px-2 text-xs font-medium transition-colors',
                              value === page
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                            )}
                          >
                            {value}
                          </button>
                        </span>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={loading || page >= totalPages}
                      onClick={() => setPage((current) => current + 1)}
                      className="h-8"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <CommunityEmptyState onCreate={() => openForm()} onSeed={seedCommunities} />
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-0 space-y-4">
          <TabHeader
            title="Post moderation"
            subtitle={`${filteredPosts.length} posts match the current search. Review pinned content and update visibility from one place.`}
          />
          {filteredPosts.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredPosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id ?? null}
                  onLike={handleLike}
                  onReplyToggle={togglePostReply}
                  adminActions={<AdminPostActions post={post} onPatch={(patch) => moderatePost(post, patch)} />}
                  footer={expandedPostId === post.id ? (
                    <PostReplyPanel
                      post={post}
                      replyBody={postReplyBody}
                      onReplyBodyChange={setPostReplyBody}
                      onCancel={() => {
                        setExpandedPostId(null);
                        setPostReplyBody('');
                      }}
                      onSubmit={() => handlePostReply(post.id)}
                      submitting={interactionSubmitting}
                    />
                  ) : null}
                />
              ))}
            </div>
          ) : (
            <TabEmptyState title="No posts match the current search" />
          )}
        </TabsContent>

        <TabsContent value="doubts" className="mt-0 space-y-4">
          <TabHeader
            title="Course Q&A queue"
            subtitle={`${filteredDoubts.length} questions match the current filters. Open ${doubtStatusCounts.open}, resolved ${doubtStatusCounts.resolved}, closed ${doubtStatusCounts.closed}.`}
          />
          {filteredDoubts.length ? (
            <div className="space-y-6">
              {filteredDoubts.map((thread) => (
                <section key={thread.id} className="space-y-2">
                  <p className="px-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    {thread.course?.name || 'Unassigned legacy'}
                  </p>
                  <DoubtCard
                    thread={thread}
                    expanded={expandedDoubtId === thread.id}
                    onToggle={() => toggleDoubtReplies(thread.id)}
                    actions={<AdminDoubtActions thread={thread} onStatus={(nextStatus) => moderateDoubt(thread, nextStatus)} />}
                  >
                    <DoubtReplyPanel
                      replies={doubtReplies[thread.id] || []}
                      replyBody={expandedDoubtId === thread.id ? doubtReplyBody : ''}
                      onReplyBodyChange={setDoubtReplyBody}
                      onCancel={() => {
                        setExpandedDoubtId(null);
                        setDoubtReplyBody('');
                      }}
                      onSubmit={() => handleDoubtReply(thread.id)}
                      submitting={interactionSubmitting}
                    />
                  </DoubtCard>
                </section>
              ))}
            </div>
          ) : (
            <TabEmptyState title="No doubts match the current search" />
          )}
        </TabsContent>
      </Tabs>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function TabHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

function TabEmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
      {title}
    </div>
  );
}

function PostReplyPanel({
  post,
  replyBody,
  onReplyBodyChange,
  onSubmit,
  onCancel,
  submitting,
}: {
  post: CommunityPost;
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
      {post.replies?.length ? (
        <div className="space-y-2">
          {post.replies.map((reply) => (
            <div key={reply.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-slate-900">{reply.author?.fullName || 'User'}</p>
                <p className="text-[11px] font-medium text-slate-400">{formatTimeAgo(reply.createdAt)}</p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{reply.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500">No replies yet. Add the first admin response.</p>
      )}

      <textarea
        value={replyBody}
        onChange={(event) => onReplyBodyChange(event.target.value)}
        rows={3}
        placeholder="Write a response..."
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={submitting || !replyBody.trim()}>Reply</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function DoubtReplyPanel({
  replies,
  replyBody,
  onReplyBodyChange,
  onSubmit,
  onCancel,
  submitting,
}: {
  replies: DoubtReply[];
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3">
      {replies.length ? (
        <div className="space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                {initials(reply.author?.fullName || 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-slate-900">{reply.author?.fullName || 'User'}</p>
                  <p className="text-[11px] font-medium text-slate-400">{formatTimeAgo(reply.createdAt)}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500">No replies yet. Add the first admin answer.</p>
      )}

      <textarea
        value={replyBody}
        onChange={(event) => onReplyBodyChange(event.target.value)}
        rows={3}
        placeholder="Write a doubt reply..."
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={submitting || !replyBody.trim()}>Reply</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AdminPostActions({
  post,
  onPatch,
}: {
  post: CommunityPost;
  onPatch: (patch: Partial<CommunityPost>) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button size="sm" variant="outline" onClick={() => onPatch({ isPinned: !post.isPinned })} className="rounded-lg">
        {post.isPinned ? 'Unpin' : 'Pin'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPatch({ status: post.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN' })}
        className="rounded-lg"
      >
        {post.status === 'HIDDEN' ? 'Publish' : 'Hide'}
      </Button>
      <Button size="sm" variant="outline" onClick={() => onPatch({ status: 'DRAFT' })} className="rounded-lg">
        Draft
      </Button>
    </div>
  );
}

function AdminDoubtActions({
  thread,
  onStatus,
}: {
  thread: DoubtThread;
  onStatus: (status: string) => void;
}) {
  return (
    <Button size="sm" variant="outline" onClick={() => onStatus(thread.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')} className="rounded-lg">
      {thread.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}
    </Button>
  );
}
