import { CheckCircle2, Eye, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityPostCard } from '@/features/community/components/CommunityPostCard';
import { DoubtCard } from '@/features/community/components/DoubtCard';
import type { CommunityPost } from '@/lib/api/community';
import type { DoubtThread } from '@/lib/api/doubts';

export function CommunityModerationRail({
  posts,
  doubts,
  onPostPatch,
  onDoubtStatus,
}: {
  posts: CommunityPost[];
  doubts: DoubtThread[];
  onPostPatch: (post: CommunityPost, patch: Partial<CommunityPost>) => void;
  onDoubtStatus: (thread: DoubtThread, status: string) => void;
}) {
  return (
    <aside className="space-y-6">
      <section className="space-y-3">
        <PanelHeading title="Post moderation" subtitle="Pinned and recent activity" />
        {posts.slice(0, 4).map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            adminActions={<PostActions post={post} onPatch={(patch) => onPostPatch(post, patch)} />}
          />
        ))}
        {posts.length === 0 ? <RailEmpty title="No posts to moderate" /> : null}
      </section>

      <section className="space-y-3">
        <PanelHeading title="Doubt queue" subtitle="Course-linked help requests" />
        {doubts.slice(0, 5).map((doubt) => (
          <DoubtCard
            key={doubt.id}
            thread={doubt}
            actions={<DoubtActions thread={doubt} onStatus={(next) => onDoubtStatus(doubt, next)} />}
          />
        ))}
        {doubts.length === 0 ? <RailEmpty title="No doubts waiting" /> : null}
      </section>
    </aside>
  );
}

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

function PostActions({ post, onPatch }: { post: CommunityPost; onPatch: (patch: Partial<CommunityPost>) => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button size="sm" variant="outline" onClick={() => onPatch({ isPinned: !post.isPinned })} className="rounded-lg">
        <Pin className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => onPatch({ status: post.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN' })} className="rounded-lg">
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        {post.status === 'HIDDEN' ? 'Publish' : 'Hide'}
      </Button>
      <Button size="sm" variant="outline" onClick={() => onPatch({ status: 'DRAFT' })} className="rounded-lg">
        Draft
      </Button>
    </div>
  );
}

function DoubtActions({ thread, onStatus }: { thread: DoubtThread; onStatus: (status: string) => void }) {
  return (
    <Button size="sm" variant="outline" onClick={() => onStatus(thread.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')} className="rounded-lg">
      <CheckCircle2 className="mr-2 h-4 w-4" />
      {thread.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}
    </Button>
  );
}

function RailEmpty({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
      {title}
    </div>
  );
}
