'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDoubtReplies, createDoubtReply, getDoubtThreads, DoubtThread, DoubtReply } from '@/lib/api/doubts';
import { MessageCircle, Send, ArrowLeft, CheckCircle2, Clock, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

export default function TeacherDoubtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();
  const id = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [thread, setThread] = useState<DoubtThread | null>(null);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u?.id ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const loadThread = useCallback(async () => {
    try {
      setLoading(true);
      // getDoubtThreads with ID filtering if supported, or just find in list
      const res = await getDoubtThreads({ teacherUserId: userId || '' });
      if (res.success && res.data) {
        const found = res.data.find(t => t.id === id);
        if (found) setThread(found);
      }
      
      const replyRes = await getDoubtReplies(id);
      if (replyRes.success && replyRes.data) setReplies(replyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    if (id) loadThread();
  }, [id, loadThread]);

  const handleSendReply = async () => {
    if (!replyBody.trim() || !userId) return;
    try {
      setSending(true);
      const res = await createDoubtReply({
        threadId: id,
        authorUserId: userId,
        body: replyBody,
      });
      if (res.success) {
        setReplyBody('');
        loadThread();
        toast({ title: 'Reply sent', variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading && !thread) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-bold">Doubt thread not found.</p>
        <Button onClick={() => router.back()} variant="link">Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to doubts
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 sm:p-10 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className={cn(
              "rounded-lg text-[10px] font-black uppercase tracking-wider border px-3 py-1",
              thread.status === 'OPEN' ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
            )}>
              {thread.status}
            </Badge>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Clock className="h-4 w-4" />
              {format(new Date(thread.createdAt), 'MMMM do, yyyy • p')}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">
              {(thread as any).course?.name || 'Assigned Course'}
            </span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 leading-tight">{thread.title}</h1>
        </div>

        <div className="p-8 sm:p-10 space-y-10">
          <div className="flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{(thread as any).student?.fullName || 'Student'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                {thread.body}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Responses ({replies.length})</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {replies.map((reply) => (
              <div key={reply.id} className={cn("flex gap-4", reply.authorUserId === userId ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg",
                  reply.authorUserId === userId ? "bg-indigo-600" : "bg-slate-400"
                )}>
                  <User className="h-5 w-5" />
                </div>
                <div className={cn("flex-1 space-y-2", reply.authorUserId === userId ? "text-right" : "")}>
                   <div className="flex items-center gap-2 justify-end">
                    {reply.authorUserId === userId && <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Teacher</span>}
                    <span className="text-[10px] font-bold text-slate-400">{format(new Date(reply.createdAt), 'MMM d, p')}</span>
                  </div>
                  <div className={cn(
                    "p-6 rounded-[2rem] border text-sm font-medium leading-relaxed whitespace-pre-wrap inline-block max-w-[90%] text-left",
                    reply.authorUserId === userId 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-100" 
                      : "bg-white text-slate-700 border-slate-100"
                  )}>
                    {reply.body}
                  </div>
                </div>
              </div>
            ))}

            {replies.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-slate-400 font-medium italic">No replies yet. Be the first to answer!</p>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex items-start gap-4">
               <div className="h-10 w-10 shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-4">
                  <textarea
                    placeholder="Type your response here..."
                    className="w-full min-h-[150px] p-6 rounded-[2rem] border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 resize-none"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSendReply} 
                      disabled={sending || !replyBody.trim()}
                      className="h-12 rounded-2xl bg-indigo-600 px-10 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
