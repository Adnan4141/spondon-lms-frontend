'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  createDoubtReply,
  getDoubtReplies,
  getDoubtThreadById,
  updateDoubtThread,
  type DoubtReply,
  type DoubtThread,
} from '@/lib/api/doubts';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoubtReplyPanel } from '@/features/community/components/DoubtReplyPanel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';
import { useQueryClient } from '@tanstack/react-query';

export function TeacherDoubtDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useTeacherSession();
  const id = params.id as string;

  const [thread, setThread] = useState<DoubtThread | null>(null);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  const invalidateDoubts = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['teacher-doubts'] });
    void queryClient.invalidateQueries({ queryKey: ['teacher-doubt-badge'] });
    void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
  }, [queryClient]);

  const loadThread = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setForbidden(false);
      const [threadRes, replyRes] = await Promise.all([
        getDoubtThreadById(id),
        getDoubtReplies(id),
      ]);
      if (threadRes.success && threadRes.data) setThread(threadRes.data);
      else setThread(null);
      if (replyRes.success && replyRes.data) setReplies(replyRes.data);
      else setReplies([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('forbidden') || message.includes('403')) {
        setForbidden(true);
      }
      setThread(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  const handleSendReply = async () => {
    if (!replyBody.trim() || !user?.id) return;
    try {
      setSending(true);
      const res = await createDoubtReply({
        threadId: id,
        authorUserId: user.id,
        body: replyBody,
      });
      if (res.success) {
        setReplyBody('');
        await loadThread();
        invalidateDoubts();
        toast({ title: 'Reply sent', variant: 'success' });
        if (thread?.status === 'RESOLVED') {
          toast({ title: 'Thread reopened', description: 'Students can continue the conversation.', variant: 'success' });
        }
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (status: 'RESOLVED' | 'OPEN') => {
    try {
      setResolving(true);
      const res = await updateDoubtThread(id, { status });
      if (res.success && res.data) {
        setThread((prev) => (prev ? { ...prev, status: res.data!.status } : prev));
        invalidateDoubts();
        toast({
          title: status === 'RESOLVED' ? 'Marked as resolved' : 'Reopened',
          variant: 'success',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResolving(false);
    }
  };

  if (loading && !thread) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="py-20 text-center">
        <p className="font-bold text-slate-500">You do not have access to this doubt thread.</p>
        <Button onClick={() => router.push('/teacher/doubts')} variant="link">
          Back to doubts
        </Button>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="py-20 text-center">
        <p className="font-bold text-slate-500">Doubt thread not found.</p>
        <Button onClick={() => router.push('/teacher/doubts')} variant="link">
          Back to doubts
        </Button>
      </div>
    );
  }

  const canReply = thread.status !== 'CLOSED';

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <button
        type="button"
        onClick={() => router.push('/teacher/doubts')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to doubts
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Badge
              variant="outline"
              className={cn(
                'rounded-lg border px-3 py-1 text-[10px] font-bold uppercase',
                thread.status === 'OPEN'
                  ? 'border-rose-100 bg-rose-50 text-rose-700'
                  : thread.status === 'CLOSED'
                    ? 'border-slate-200 bg-slate-100 text-slate-600'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-700',
              )}
            >
              {thread.status}
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              {thread.status === 'OPEN' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resolving}
                  onClick={() => void handleResolve('RESOLVED')}
                  className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  {resolving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Mark resolved
                </Button>
              ) : thread.status === 'RESOLVED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resolving}
                  onClick={() => void handleResolve('OPEN')}
                  className="gap-1.5"
                >
                  {resolving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Reopen
                </Button>
              ) : null}
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(thread.createdAt), 'MMM d, yyyy • p')}
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {thread.course?.name || 'Assigned course'}
            </span>
          </div>

          <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{thread.title}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Asked by {thread.student?.fullName || 'Student'}
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {thread.body}
          </div>

          <DoubtReplyPanel
            replies={replies}
            replyBody={replyBody}
            onReplyBodyChange={setReplyBody}
            onSubmit={() => void handleSendReply()}
            submitting={sending}
            placeholder="Type your response to the student..."
            emptyLabel="No replies yet. Be the first to answer."
            showComposer={canReply}
          />

          {thread.status === 'RESOLVED' && canReply ? (
            <p className="text-xs text-slate-400">
              Replying will automatically reopen this thread so the conversation can continue.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
