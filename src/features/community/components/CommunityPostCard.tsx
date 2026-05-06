import type { ReactNode } from 'react';
import { Heart, MessageSquare, Pin, Share2 } from 'lucide-react';
import type { CommunityPost } from '@/lib/api/community';
import { cn } from '@/lib/utils';
import { AttachmentRenderer } from './AttachmentRenderer';
import { formatTimeAgo, initials, voteSum } from './community-utils';

export function CommunityPostCard({
  post,
  currentUserId,
  onLike,
  onReplyToggle,
  onShare,
  footer,
  adminActions,
}: {
  post: CommunityPost;
  currentUserId?: string | null;
  onLike?: (post: CommunityPost) => void;
  onReplyToggle?: (post: CommunityPost) => void;
  onShare?: (post: CommunityPost) => void;
  footer?: ReactNode;
  adminActions?: ReactNode;
}) {
  const liked = Boolean(currentUserId && post.votes?.some((v) => v.userId === currentUserId && v.value === 1));
  const score = voteSum(post.votes);
  const replyCount = post._count?.replies ?? post.replies?.length ?? 0;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-violet-500 text-sm font-black text-white">
              {initials(post.author?.fullName || 'User')}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-slate-950">{post.author?.fullName || 'Unknown user'}</h3>
                {post.isPinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {post.community?.name || 'Open community'} · {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          {adminActions}
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-black leading-snug text-slate-950">{post.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{post.body}</p>
          <AttachmentRenderer attachments={post.attachments} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLike?.(post)}
              className={cn('flex items-center gap-1.5 text-sm font-bold', liked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600')}
            >
              <Heart className={cn('h-5 w-5', liked && 'fill-current')} />
              {score}
            </button>
            <button
              type="button"
              onClick={() => onReplyToggle?.(post)}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-sky-600"
            >
              <MessageSquare className="h-5 w-5" />
              {replyCount} Insights
            </button>
          </div>
          <button
            type="button"
            onClick={() => onShare?.(post)}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {footer}
      </div>
    </article>
  );
}
