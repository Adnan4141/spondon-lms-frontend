'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Users, Heart, Send, X } from 'lucide-react';
import {
  getCommunityPosts,
  createCommunityPost,
  createCommunityReply,
  createCommunityVote,
  deleteCommunityVote,
  type CommunityPost as PostType,
} from '@/lib/api/community';
import { getMyCourses } from '@/lib/api/student-portal';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export default function StudentCommunityPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<{ id: string; course: { id: string; name: string }; batch?: { id: string; name: string } }[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createBody, setCreateBody] = useState('');
  const [createCourseId, setCreateCourseId] = useState('');
  const [createBatchId, setCreateBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [user, setUser] = useState<{ id: string; fullName: string } | null>(null);
  const { toast, toasts, removeToast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: { courseId?: string; batchId?: string } = {};
      if (courseFilter) params.courseId = courseFilter;
      if (batchFilter) params.batchId = batchFilter;
      const res = await getCommunityPosts(params);
      if (res.success && res.data) setPosts(res.data);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'পোস্ট লোড করতে ব্যর্থ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [courseFilter, batchFilter]);

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUser(parsed);
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
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!user?.id || !createTitle.trim() || !createBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createCommunityPost({
        authorId: user.id,
        title: createTitle.trim(),
        body: createBody.trim(),
        courseId: createCourseId || undefined,
        batchId: createBatchId || undefined,
        visibility: 'PUBLIC',
      });
      if (res.success) {
        setShowCreateModal(false);
        setCreateTitle('');
        setCreateBody('');
        setCreateCourseId('');
        setCreateBatchId('');
        fetchPosts();
      } else throw new Error(res.message);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'পোস্ট তৈরি ব্যর্থ হয়েছে', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (postId: string) => {
    if (!user?.id || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createCommunityReply({ postId, authorId: user.id, body: replyBody.trim() });
      if (res.success) {
        setReplyingTo(null);
        setReplyBody('');
        fetchPosts();
      } else throw new Error(res.message);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'মন্তব্য যোগ ব্যর্থ হয়েছে', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeToggle = async (post: PostType) => {
    if (!user?.id) {
      toast({ title: 'লগইন প্রয়োজন', description: 'লাইক দিতে লগইন করুন', variant: 'destructive' });
      return;
    }
    const liked = userVote(post.votes) === 1;
    const prevPosts = [...posts];

    // Optimistic update: apply UI change immediately
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== post.id) return p;
        const votes = p.votes ?? [];
        const existingIdx = votes.findIndex((v) => v.userId === user.id);
        let newVotes: typeof votes;
        if (liked) {
          newVotes = votes.filter((v) => v.userId !== user.id);
        } else {
          const newVote = { id: `opt-${Date.now()}`, postId: p.id, userId: user.id, value: 1 };
          if (existingIdx >= 0) {
            newVotes = votes.map((v, i) => (i === existingIdx ? newVote : v));
          } else {
            newVotes = [...votes, newVote];
          }
        }
        return { ...p, votes: newVotes };
      })
    );

    try {
      if (liked) {
        const res = await deleteCommunityVote(post.id, user.id);
        if (!res.success) throw new Error(res.message);
      } else {
        const res = await createCommunityVote({ postId: post.id, userId: user.id, value: 1 });
        if (!res.success) throw new Error(res.message);
      }
    } catch (e: any) {
      // Revert on failure
      setPosts(prevPosts);
      toast({ title: 'ত্রুটি', description: e.message || 'লাইক করতে ব্যর্থ', variant: 'destructive' });
    }
  };

  const voteSum = (votes: { value: number }[] | undefined) =>
    votes?.reduce((s, v) => s + v.value, 0) ?? 0;

  const userVote = (votes: { userId: string; value: number }[] | undefined) =>
    votes?.find((v) => v.userId === user?.id)?.value ?? 0;

  const uniqueCoursesMap = new Map<string, { id: string; name: string }>();
  for (const c of courses) {
    if (c.course?.id) uniqueCoursesMap.set(c.course.id, c.course);
  }
  const uniqueCourses = Array.from(uniqueCoursesMap.values());
  const batchesForCourse = courseFilter
    ? courses.filter((c) => c.course?.id === courseFilter)
    : [];

  return (
    <>
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">কমিউনিটি</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">সবার সাথে আলোচনা করুন</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setBatchFilter('');
            }}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">সব কোর্স</option>
            {uniqueCourses.map((c) => (
              <option key={c?.id} value={c?.id}>
                {c?.name}
              </option>
            ))}
          </select>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">সব ব্যাচ</option>
            {batchesForCourse.map((c) => (
              <option key={c.batch?.id || c.id} value={c.batch?.id || ''}>
                {c.batch?.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => (user ? setShowCreateModal(true) : (window.location.href = '/login?redirect=/student/community'))}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            পোস্ট তৈরি করুন
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {posts.length === 0 ? (
              <Card className="rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-16 text-center">
                <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">কোনো পোস্ট নেই</h3>
                <p className="text-slate-500 font-medium mb-6">প্রথম পোস্ট করুন</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700"
                >
                  নতুন পোস্ট
                </button>
              </Card>
            ) : (
              posts.map((post) => {
                const score = voteSum(post.votes);
                const myVote = userVote(post.votes);
                return (
                  <Card key={post.id} className="rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                            {getInitials(post.author?.fullName || 'User')}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900">{post.author?.fullName || 'অজানা'}</h4>
                            <p className="text-xs text-slate-400 font-bold">
                              {formatTimeAgo(post.createdAt)}
                              {post.course?.name && ` • ${post.course.name}`}
                              {post.batch?.name && ` • ${post.batch.name}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-black text-slate-900 mb-2">{post.title}</h3>
                      <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">{post.body}</p>
                      <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                        <button
                          onClick={() => handleLikeToggle(post)}
                          className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${myVote === 1 ? 'text-rose-500 bg-rose-50 fill-rose-500' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                          title="লাইক"
                        >
                          <Heart className={`h-5 w-5 ${myVote === 1 ? 'fill-current' : ''}`} />
                          <span className="font-black text-slate-700 min-w-6">{score}</span>
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm"
                        >
                          <MessageSquare className="h-5 w-5" /> {post.replies?.length ?? 0} মন্তব্য
                        </button>
                      </div>

                      {replyingTo === post.id && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="মন্তব্য..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleReply(post.id)}
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
                      )}

                      {post.replies && post.replies.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                          {post.replies.map((r) => (
                            <div key={r.id} className="flex gap-4 pl-4 border-l-2 border-indigo-100">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                                {getInitials(r.author?.fullName || '?')}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{r.author?.fullName || 'অজানা'}</p>
                                <p className="text-slate-600 text-sm mt-0.5">{r.body}</p>
                                <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(r.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2rem] border-none bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-black text-slate-900 mb-6">আপনার কোর্স</h3>
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <p className="text-slate-500 text-sm font-medium">কোর্সে ভর্তি হয়ে ফিল্টার করুন</p>
                ) : (
                  courses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCourseFilter(courseFilter === c.course?.id ? '' : c.course?.id || '')}
                      className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-colors text-left group ${
                        courseFilter === c.course?.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                        courseFilter === c.course?.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">{c.course?.name}</span>
                        {c.batch?.name && <span className="text-xs text-slate-400">{c.batch.name}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-[2rem] border-none shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900">নতুন পোস্ট</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="শিরোনাম"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                />
                <textarea
                  value={createBody}
                  onChange={(e) => setCreateBody(e.target.value)}
                  placeholder="লিখুন"
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
                />
                <select
                  value={createCourseId}
                  onChange={(e) => { setCreateCourseId(e.target.value); setCreateBatchId(''); }}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="">কোর্স (ঐচ্ছিক)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.course?.id}>{c.course?.name}</option>
                  ))}
                </select>
                <select
                  value={createBatchId}
                  onChange={(e) => setCreateBatchId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="">ব্যাচ (ঐচ্ছিক)</option>
                  {courses.filter((c) => c.course?.id === createCourseId).map((c) => (
                    <option key={c.batch?.id || c.id} value={c.batch?.id}>{c.batch?.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreatePost}
                  disabled={submitting || !createTitle.trim() || !createBody.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? 'করা হচ্ছে...' : 'পোস্ট'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200"
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
