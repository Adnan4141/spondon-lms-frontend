'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toast';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { CommunityAdminFilters } from '@/features/admin/communities/components/CommunityAdminFilters';
import { CommunityAdminHero } from '@/features/admin/communities/components/CommunityAdminHero';
import { CommunityCard } from '@/features/admin/communities/components/CommunityCard';
import { CommunityEmptyState } from '@/features/admin/communities/components/CommunityEmptyState';
import { CommunityForm } from '@/features/admin/communities/components/CommunityForm';
import { CommunityKpiGrid } from '@/features/admin/communities/components/CommunityKpiGrid';
import { CommunityModerationRail } from '@/features/admin/communities/components/CommunityModerationRail';
import { getErrorMessage } from '@/features/admin/communities/components/community-admin-utils';
import { useToast } from '@/hooks/use-toast';
import {
  deleteCommunity,
  getCommunities,
  getCommunityPosts,
  seedDemoCommunities,
  updateCommunity,
  updateCommunityPost,
  type Community,
  type CommunityPost,
} from '@/lib/api/community';
import { getDoubtThreads, updateDoubtThread, type DoubtThread } from '@/lib/api/doubts';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/store/modalStore';

export default function AdminCommunitiesPage() {
  const router = useRouter();
  const { user } = useAdminSession();
  const { toast, toasts, removeToast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [doubts, setDoubts] = useState<DoubtThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [communityRes, postRes, doubtRes] = await Promise.all([
        getCommunities(),
        getCommunityPosts({ search: search || undefined }),
        getDoubtThreads({ search: search || undefined }),
      ]);
      if (communityRes.success && communityRes.data) setCommunities(communityRes.data);
      if (postRes.success && postRes.data) setPosts(postRes.data);
      if (doubtRes.success && doubtRes.data) setDoubts(doubtRes.data);
    } catch (error) {
      toast({ title: 'Failed to load', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    load();
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
  }, [search, status, visibility]);

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
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Community spaces</h2>
              <p className="text-sm font-medium text-slate-500">{filteredCommunities.length} spaces match the current filters.</p>
            </div>
          </div>

          {filteredCommunities.length ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
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
        </section>

        <CommunityModerationRail
          posts={posts}
          doubts={doubts}
          onPostPatch={moderatePost}
          onDoubtStatus={moderateDoubt}
        />
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
