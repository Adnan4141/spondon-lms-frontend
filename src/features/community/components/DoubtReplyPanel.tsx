'use client';

import type { DoubtReply } from '@/lib/api/doubts';
import { Button } from '@/components/ui/button';
import { initials, formatTimeAgo } from './community-utils';

export function DoubtReplyPanel({
  replies,
  replyBody,
  onReplyBodyChange,
  onSubmit,
  onCancel,
  submitting,
  placeholder = 'Write a doubt reply...',
  emptyLabel = 'No replies yet.',
  showComposer = true,
}: {
  replies: DoubtReply[];
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitting: boolean;
  placeholder?: string;
  emptyLabel?: string;
  showComposer?: boolean;
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
                  <p className="text-xs font-black text-slate-900">
                    {reply.author?.fullName || 'User'}
                    {reply.author?.role === 'TEACHER' ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-indigo-600">Teacher</span>
                    ) : null}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400">{formatTimeAgo(reply.createdAt)}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500">{emptyLabel}</p>
      )}

      {showComposer ? (
        <>
          <textarea
            value={replyBody}
            onChange={(event) => onReplyBodyChange(event.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSubmit} disabled={submitting || !replyBody.trim()}>
              Reply
            </Button>
            {onCancel ? (
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
