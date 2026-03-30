'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Search, MessageCircle, Clock, ArrowRight, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import {
  getDoubtThreads,
  createDoubtThread,
  getDoubtReplies,
  createDoubtReply,
  type DoubtThread,
  type DoubtReply,
} from '@/lib/api/doubts';
import { getMyCourses } from '@/lib/api/student-portal';

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  return d.toLocaleDateString();
}

export default function StudentDoubtsPage() {
  const [threads, setThreads] = useState<DoubtThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [courses, setCourses] = useState<{ course: { id: string; name: string } }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [askTitle, setAskTitle] = useState('');
  const [askBody, setAskBody] = useState('');
  const [askCourseId, setAskCourseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, DoubtReply[]>>({});
  const [replyBody, setReplyBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast, toasts, removeToast } = useToast();

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params: { studentUserId?: string; courseId?: string } = {};
      if (user?.id) params.studentUserId = user.id;
      if (courseFilter) params.courseId = courseFilter;
      const res = await getDoubtThreads(params);
      if (res.success && res.data) setThreads(res.data);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'প্রশ্ন লোড করতে ব্যর্থ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, courseFilter]);

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      getMyCourses(user.id)
        .then((r) => {
          if (r.success && r.data) setCourses(r.data);
        })
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (expandedThread) {
      getDoubtReplies(expandedThread)
        .then((r) => {
          if (r.success && r.data) setReplies((prev) => ({ ...prev, [expandedThread]: r.data! }));
        })
        .catch(() => {});
    }
  }, [expandedThread]);

  const handleAskQuestion = async () => {
    if (!user?.id || !askTitle.trim() || !askBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createDoubtThread({
        studentUserId: user.id,
        title: askTitle.trim(),
        body: askBody.trim(),
        courseId: askCourseId || undefined,
      });
      if (res.success) {
        setShowAskModal(false);
        setAskTitle('');
        setAskBody('');
        setAskCourseId('');
        fetchThreads();
      } else throw new Error(res.message);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'প্রশ্ন জমা ব্যর্থ হয়েছে', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (threadId: string) => {
    if (!user?.id || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createDoubtReply({ threadId, authorUserId: user.id, body: replyBody.trim() });
      if (res.success) {
        setReplyingTo(null);
        setReplyBody('');
        getDoubtReplies(threadId).then((r) => {
          if (r.success && r.data) setReplies((prev) => ({ ...prev, [threadId]: r.data! }));
        });
      } else throw new Error(res.message);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'উত্তর ব্যর্থ হয়েছে', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">প্রশ্ন ও উত্তর</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">সাহায্য নিন</p>
        </div>
        <button
          onClick={() => (user ? setShowAskModal(true) : (window.location.href = '/login?redirect=/student/doubts'))}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          প্রশ্ন করুন
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খুঁজুন..."
              className="w-full pl-16 pr-6 py-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700"
          >
            <option value="">সব কোর্স</option>
            {courses.map((c) => (
              <option key={c.course?.id} value={c.course?.id}>
                {c.course?.name}
              </option>
            ))}
          </select>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.length === 0 ? (
                <Card className="rounded-[2rem] border-none bg-white p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">কোনো প্রশ্ন নেই</h3>
                  <p className="text-slate-500 font-medium mb-6">প্রথম প্রশ্ন করুন</p>
                  <button
                    onClick={() => setShowAskModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700"
                  >
                    প্রশ্ন করুন
                  </button>
                </Card>
              ) : (
                filteredThreads.map((thread) => {
                  const isExpanded = expandedThread === thread.id;
                  const threadReplies = replies[thread.id] || [];
                  const isReplying = replyingTo === thread.id;
                  return (
                    <Card
                      key={thread.id}
                      className="rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
                    >
                      <CardContent className="p-8">
                        <div className="flex items-start gap-6">
                          <div
                            className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                              thread.status === 'RESOLVED' || thread.status === 'CLOSED'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            <HelpCircle className="h-7 w-7" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                  thread.status === 'RESOLVED' || thread.status === 'CLOSED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {thread.status === 'RESOLVED' ? 'সমাধান' : thread.status === 'CLOSED' ? 'বন্ধ' : 'খোলা'}
                              </span>
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {formatTimeAgo(thread.createdAt)}
                              </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{thread.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{thread.body}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-400 font-bold">
                              <MessageCircle className="h-5 w-5" />
                              <span>{threadReplies.length}</span>
                            </div>
                            <button
                              onClick={() => setExpandedThread(isExpanded ? null : thread.id)}
                              className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                            >
                              <ArrowRight
                                className={`h-6 w-6 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-8 pt-8 border-t border-slate-100">
                            <h4 className="font-black text-slate-900 mb-4">উত্তর ({threadReplies.length})</h4>
                            <div className="space-y-4 mb-6">
                              {threadReplies.length === 0 ? (
                                <p className="text-slate-500 font-medium">কোনো উত্তর নেই। উত্তর দিন</p>
                              ) : (
                                threadReplies.map((r) => (
                                  <div
                                    key={r.id}
                                    className="pl-4 border-l-2 border-indigo-100 py-2"
                                  >
                                    <p className="text-slate-600">{r.body}</p>
                                    <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(r.createdAt)}</p>
                                  </div>
                                ))
                              )}
                            </div>
                            {isReplying ? (
                              <div>
                                <textarea
                                  value={replyBody}
                                  onChange={(e) => setReplyBody(e.target.value)}
                                  placeholder="উত্তর..."
                                  rows={3}
                                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
                                />
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleReply(thread.id)}
                                    disabled={submitting || !replyBody.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                  >
                                    <Send className="h-4 w-4" /> পাঠান
                                  </button>
                                  <button
                                    onClick={() => { setReplyingTo(null); setReplyBody(''); }}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                                  >
                                    বাতিল
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReplyingTo(thread.id)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100"
                              >
                                উত্তর
                              </button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-none bg-indigo-600 p-10 text-white shadow-2xl shadow-indigo-100">
            <h3 className="text-2xl font-black mb-4 leading-tight">প্রশ্ন</h3>
            <p className="text-indigo-100 font-medium mb-8 leading-relaxed text-sm">
              প্রশ্ন করুন বা উত্তর দিন
            </p>
            <button
              onClick={() => setShowAskModal(true)}
              className="w-full py-4 rounded-2xl bg-white text-indigo-600 font-black text-sm hover:bg-indigo-50 transition-colors"
            >
              প্রশ্ন করুন
            </button>
          </Card>
        </div>
      </div>

      {showAskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-[2rem] border-none shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900">প্রশ্ন করুন</h3>
                <button onClick={() => setShowAskModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  value={askTitle}
                  onChange={(e) => setAskTitle(e.target.value)}
                  placeholder="প্রশ্ন"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                />
                <textarea
                  value={askBody}
                  onChange={(e) => setAskBody(e.target.value)}
                  placeholder="বিস্তারিত"
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
                />
                <select
                  value={askCourseId}
                  onChange={(e) => setAskCourseId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="">কোর্স (ঐচ্ছিক)</option>
                  {courses.map((c) => (
                    <option key={c.course?.id} value={c.course?.id}>
                      {c.course?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAskQuestion}
                  disabled={submitting || !askTitle.trim() || !askBody.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'করা হচ্ছে...' : 'জমা করুন'}
                </button>
                <button
                  onClick={() => setShowAskModal(false)}
                  className="px-6 py-3 bg-slate-700 text-white rounded-2xl font-bold text-sm hover:bg-slate-800"
                >
                  বাতিল
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    <Toaster toasts={toasts} removeToast={removeToast} />
    </>
  );
}
