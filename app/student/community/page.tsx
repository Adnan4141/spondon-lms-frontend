'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, FileUp, HelpCircle, ImageIcon, LinkIcon, MessageSquare, Search, Send, Sparkles, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  createCommunityPost,
  createCommunityReply,
  createCommunityVote,
  deleteCommunityVote,
  getCommunities,
  getCommunityPosts,
  uploadCommunityAttachment,
  type Community,
  type CommunityAttachment,
  type CommunityPost,
} from '@/lib/api/community';
import {
  createDoubtReply,
  createDoubtThread,
  getDoubtReplies,
  getDoubtThreads,
  type DoubtReply,
  type DoubtThread,
} from '@/lib/api/doubts';
import { getMyCourses } from '@/lib/api/student-portal';
import { CommunityPostCard } from '@/features/community/components/CommunityPostCard';
import { DoubtCard } from '@/features/community/components/DoubtCard';
import { formatTimeAgo, initials } from '@/features/community/components/community-utils';
import { cn } from '@/lib/utils';

type StudentCourse = { id: string; course: { id: string; name: string }; batch?: { id: string; name: string } };
type UserLite = { id: string; fullName?: string };

function readUser(): UserLite | null {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function StudentCommunityPage() {
  const { toast, toasts, removeToast } = useToast();
  const [user, setUser] = useState<UserLite | null>(null);
  const [activeTab, setActiveTab] = useState<'community' | 'doubts'>('community');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [threads, setThreads] = useState<DoubtThread[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postAttachmentMode, setPostAttachmentMode] = useState<'file' | 'link'>('file');
  const [postAttachmentFile, setPostAttachmentFile] = useState<File | null>(null);
  const [postAttachmentUrl, setPostAttachmentUrl] = useState('');
  const [postCommunityId, setPostCommunityId] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [askTitle, setAskTitle] = useState('');
  const [askBody, setAskBody] = useState('');
  const [replyingToPost, setReplyingToPost] = useState<string | null>(null);
  const [replyingToDoubt, setReplyingToDoubt] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [expandedDoubt, setExpandedDoubt] = useState<string | null>(null);
  const [doubtReplies, setDoubtReplies] = useState<Record<string, DoubtReply[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUser(readUser());
    const preferredTab = localStorage.getItem('student-community-tab');
    if (preferredTab === 'doubts') {
      setActiveTab('doubts');
      localStorage.removeItem('student-community-tab');
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getMyCourses(user.id).then((r) => {
      if (r.success && r.data) setCourses(r.data as StudentCourse[]);
    }).catch(() => {});
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, doubtRes, communityRes] = await Promise.all([
        getCommunityPosts({ courseId: courseFilter || undefined, status: 'PUBLISHED', search: activeTab === 'community' ? search || undefined : undefined }),
        getDoubtThreads({ courseId: courseFilter || undefined, search: activeTab === 'doubts' ? search || undefined : undefined }),
        getCommunities({ status: 'ACTIVE' }),
      ]);
      if (postRes.success && postRes.data) setPosts(postRes.data);
      if (doubtRes.success && doubtRes.data) setThreads(doubtRes.data);
      if (communityRes.success && communityRes.data) setCommunities(communityRes.data);
    } catch (error: any) {
      toast({ title: 'Could not load community', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, courseFilter, search, toast, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uniqueCourses = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    courses.forEach((row) => row.course?.id && map.set(row.course.id, row.course));
    return Array.from(map.values());
  }, [courses]);

  const topPosts = useMemo(() => [...posts].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0)).slice(0, 5), [posts]);
  const topDoubts = useMemo(() => [...threads].sort((a, b) => (b._count?.replies || 0) - (a._count?.replies || 0)).slice(0, 5), [threads]);

  const requireUser = () => {
    if (user?.id) return true;
    window.location.href = '/login?redirect=/student/community';
    return false;
  };

  const handleCreatePost = async () => {
    if (!requireUser() || !postTitle.trim() || !postBody.trim()) return;
    setSubmitting(true);
    try {
      let attachments: CommunityAttachment[] | undefined;
      if (postAttachmentMode === 'file' && postAttachmentFile) {
        const uploadRes = await uploadCommunityAttachment(postAttachmentFile);
        if (!uploadRes.success || !uploadRes.data) throw new Error(uploadRes.message || 'Attachment upload failed');
        attachments = [uploadRes.data];
      } else if (postAttachmentMode === 'link' && postAttachmentUrl.trim()) {
        const url = postAttachmentUrl.trim();
        attachments = [{
          type: /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ? 'video' : /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url) ? 'image' : 'link',
          url,
          title: 'Shared link',
        }];
      }
      const res = await createCommunityPost({
        authorId: user!.id,
        communityId: postCommunityId || undefined,
        courseId: courseFilter || undefined,
        title: postTitle.trim(),
        body: postBody.trim(),
        visibility: 'PUBLIC',
        attachments,
      });
      if (!res.success) throw new Error(res.message);
      setComposerOpen(false);
      setPostTitle('');
      setPostBody('');
      setPostAttachmentFile(null);
      setPostAttachmentUrl('');
      setPostCommunityId('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Post failed', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskDoubt = async () => {
    if (!requireUser() || !askTitle.trim() || !askBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createDoubtThread({
        studentUserId: user!.id,
        courseId: courseFilter || undefined,
        title: askTitle.trim(),
        body: askBody.trim(),
      });
      if (!res.success) throw new Error(res.message);
      setAskOpen(false);
      setAskTitle('');
      setAskBody('');
      setActiveTab('doubts');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Question failed', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: CommunityPost) => {
    if (!requireUser()) return;
    const liked = post.votes?.some((v) => v.userId === user!.id && v.value === 1);
    const snapshot = posts;
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, votes: liked ? p.votes?.filter((v) => v.userId !== user!.id) : [...(p.votes || []), { id: `opt-${Date.now()}`, postId: p.id, userId: user!.id, value: 1 }] } : p));
    try {
      const res = liked ? await deleteCommunityVote(post.id, user!.id) : await createCommunityVote({ postId: post.id, userId: user!.id, value: 1 });
      if (!res.success) throw new Error(res.message);
    } catch (error: any) {
      setPosts(snapshot);
      toast({ title: 'Appreciation failed', description: error?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handlePostReply = async (postId: string) => {
    if (!requireUser() || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createCommunityReply({ postId, authorId: user!.id, body: replyBody.trim() });
      if (!res.success) throw new Error(res.message);
      setReplyBody('');
      setReplyingToPost(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDoubt = async (threadId: string) => {
    const next = expandedDoubt === threadId ? null : threadId;
    setExpandedDoubt(next);
    if (next && !doubtReplies[next]) {
      const res = await getDoubtReplies(next);
      if (res.success && res.data) setDoubtReplies((prev) => ({ ...prev, [next]: res.data! }));
    }
  };

  const handleDoubtReply = async (threadId: string) => {
    if (!requireUser() || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createDoubtReply({ threadId, authorUserId: user!.id, body: replyBody.trim() });
      if (!res.success) throw new Error(res.message);
      setReplyBody('');
      setReplyingToDoubt(null);
      const replyRes = await getDoubtReplies(threadId);
      if (replyRes.success && replyRes.data) setDoubtReplies((prev) => ({ ...prev, [threadId]: replyRes.data! }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70">
      <div className="mx-auto grid max-w-[1540px] gap-6 px-4 py-6 xl:grid-cols-[330px_minmax(0,1fr)_330px]">
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Featured Courses" icon={<Sparkles className="h-5 w-5" />}>
            <CourseHero title="Medical Secret Files-25" />
          </Panel>
          <Panel title="Popular Courses" action="See all" icon={<BookOpen className="h-5 w-5" />}>
            <div className="space-y-4">
              {uniqueCourses.slice(0, 5).map((course, index) => (
                <button key={course.id} onClick={() => setCourseFilter(courseFilter === course.id ? '' : course.id)} className={cn('w-full rounded-xl border p-3 text-left transition', courseFilter === course.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-200')}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-linear-to-br from-slate-800 to-sky-700 text-xs font-black text-white">C{index + 1}</div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-black text-slate-900">{course.name}</p>
                      <p className="text-xs text-slate-500">Tap to filter</p>
                    </div>
                  </div>
                </button>
              ))}
              {uniqueCourses.length === 0 ? <p className="text-sm text-slate-500">Enroll in a course to personalize your feed.</p> : null}
            </div>
          </Panel>
        </aside>

        <main className="min-w-0 space-y-4">
          <Card className="rounded-xl border-none bg-white shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                {initials(user?.fullName || 'S')}
              </div>
              <button onClick={() => (requireUser() ? setComposerOpen(true) : null)} className="flex-1 rounded-full bg-slate-100 px-5 py-3 text-left text-sm font-medium text-slate-500 hover:bg-slate-200">
                Share your insights{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}?
              </button>
              <Button variant="ghost" size="icon" onClick={() => setComposerOpen(true)}><ImageIcon className="h-5 w-5" /></Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 rounded-xl bg-white p-1 shadow-sm">
            <button onClick={() => setActiveTab('community')} className={cn('rounded-lg py-3 text-sm font-black', activeTab === 'community' ? 'bg-sky-50 text-sky-600' : 'text-slate-700')}>Community</button>
            <button onClick={() => setActiveTab('doubts')} className={cn('rounded-lg py-3 text-sm font-black', activeTab === 'doubts' ? 'bg-sky-50 text-sky-600' : 'text-slate-700')}>Doubts</button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 rounded-xl bg-white pl-10" placeholder={activeTab === 'community' ? 'Search community posts...' : 'Search doubts...'} />
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></div>
          ) : activeTab === 'community' ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onReplyToggle={(p) => setReplyingToPost(replyingToPost === p.id ? null : p.id)}
                  onShare={(p) => navigator.clipboard?.writeText(`${window.location.origin}/student/community?post=${p.id}`)}
                  footer={replyingToPost === post.id ? (
                    <ReplyBox value={replyBody} onChange={setReplyBody} onCancel={() => { setReplyingToPost(null); setReplyBody(''); }} onSubmit={() => handlePostReply(post.id)} submitting={submitting} />
                  ) : null}
                />
              ))}
              {posts.length === 0 ? <EmptyState title="No posts yet" text="Be the first to share an update." /> : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => (requireUser() ? setAskOpen(true) : null)} className="rounded-xl bg-slate-900">Ask a question</Button></div>
              {threads.map((thread) => (
                <DoubtCard key={thread.id} thread={thread} expanded={expandedDoubt === thread.id} onToggle={() => toggleDoubt(thread.id)}>
                  <div className="space-y-3">
                    {(doubtReplies[thread.id] || []).map((reply) => (
                      <div key={reply.id} className="rounded-lg border-l-2 border-sky-200 bg-slate-50 p-3">
                        <p className="text-sm text-slate-700">{reply.body}</p>
                        <p className="mt-1 text-xs text-slate-400">{reply.author?.fullName || 'Responder'} · {formatTimeAgo(reply.createdAt)}</p>
                      </div>
                    ))}
                    {replyingToDoubt === thread.id ? (
                      <ReplyBox value={replyBody} onChange={setReplyBody} onCancel={() => { setReplyingToDoubt(null); setReplyBody(''); }} onSubmit={() => handleDoubtReply(thread.id)} submitting={submitting} />
                    ) : (
                      <Button variant="outline" className="rounded-lg" onClick={() => setReplyingToDoubt(thread.id)}>Reply</Button>
                    )}
                  </div>
                </DoubtCard>
              ))}
              {threads.length === 0 ? <EmptyState title="No doubts yet" text="Ask a question and get help from your mentors." /> : null}
            </div>
          )}
        </main>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Right Now" icon={<Users className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-3">
              <Stat value={communities.length} label="Communities" />
              <Stat value={posts.length} label="Posts" />
              <Stat value={threads.filter((t) => t.status === 'OPEN').length} label="Open doubts" />
              <Stat value={topPosts.length + topDoubts.length} label="Trending" />
            </div>
          </Panel>
          <Panel title="Top Doubts" icon={<HelpCircle className="h-5 w-5" />}>
            <SideList items={topDoubts.map((d) => ({ title: d.title, meta: `${d._count?.replies || 0} replies` }))} />
          </Panel>
          <Panel title="Top Posts" icon={<MessageSquare className="h-5 w-5" />}>
            <SideList items={topPosts.map((p) => ({ title: p.title, meta: `${p.votes?.length || 0} appreciations` }))} />
          </Panel>
        </aside>
      </div>

      {composerOpen ? (
        <ComposerModal title="Create post" onClose={() => setComposerOpen(false)} onSubmit={handleCreatePost} submitting={submitting} submitLabel="Post">
          <Input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Post title" />
          <textarea value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="Share your update..." rows={5} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
          <AttachmentInput
            mode={postAttachmentMode}
            onModeChange={(mode) => {
              setPostAttachmentMode(mode);
              setPostAttachmentFile(null);
              setPostAttachmentUrl('');
            }}
            file={postAttachmentFile}
            onFileChange={setPostAttachmentFile}
            link={postAttachmentUrl}
            onLinkChange={setPostAttachmentUrl}
          />
          <select value={postCommunityId} onChange={(e) => setPostCommunityId(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="">No specific community</option>
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </ComposerModal>
      ) : null}

      {askOpen ? (
        <ComposerModal title="Ask a doubt" onClose={() => setAskOpen(false)} onSubmit={handleAskDoubt} submitting={submitting} submitLabel="Ask">
          <Input value={askTitle} onChange={(e) => setAskTitle(e.target.value)} placeholder="Question title" />
          <textarea value={askBody} onChange={(e) => setAskBody(e.target.value)} placeholder="Explain what you need help with..." rows={5} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
        </ComposerModal>
      ) : null}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function Panel({ title, icon, action, children }: { title: string; icon: ReactNode; action?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">{icon}{title}</h2>
        {action ? <span className="text-xs font-bold text-sky-600">{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function CourseHero({ title }: { title: string }) {
  return (
    <div className="flex aspect-video items-center justify-center rounded-xl bg-linear-to-br from-sky-100 via-white to-amber-100 p-5 text-center">
      <p className="text-2xl font-black uppercase tracking-wide text-slate-900">{title}</p>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>;
}

function SideList({ items }: { items: Array<{ title: string; meta: string }> }) {
  return <div className="space-y-3">{items.length ? items.map((item, i) => <div key={`${item.title}-${i}`} className="border-l-2 border-slate-200 pl-3"><p className="line-clamp-2 text-sm font-bold text-slate-800">{item.title}</p><p className="text-xs text-rose-500">{item.meta}</p></div>) : <p className="text-sm text-slate-500">Nothing trending yet.</p>}</div>;
}

function AttachmentInput({
  mode,
  onModeChange,
  file,
  onFileChange,
  link,
  onLinkChange,
}: {
  mode: 'file' | 'link';
  onModeChange: (mode: 'file' | 'link') => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  link: string;
  onLinkChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1">
        <button
          type="button"
          onClick={() => onModeChange('file')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-black transition',
            mode === 'file' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <FileUp className="h-4 w-4" />
          File upload
        </button>
        <button
          type="button"
          onClick={() => onModeChange('link')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-black transition',
            mode === 'link' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <LinkIcon className="h-4 w-4" />
          Link upload
        </button>
      </div>

      {mode === 'file' ? (
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-sky-200 bg-white px-4 py-5 text-center hover:border-sky-400">
          <FileUp className="h-7 w-7 text-sky-600" />
          <span className="mt-2 text-sm font-black text-slate-900">{file ? file.name : 'Choose image, video, PDF, or document'}</span>
          <span className="mt-1 text-xs font-medium text-slate-500">Maximum file size 50MB</span>
          <input
            type="file"
            className="sr-only"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
        </label>
      ) : (
        <div className="mt-3">
          <Input value={link} onChange={(event) => onLinkChange(event.target.value)} placeholder="Paste image, video, or website URL" className="bg-white" />
          <p className="mt-2 text-xs font-medium text-slate-500">Direct image/video links render inline. Other URLs show as link cards.</p>
        </div>
      )}
    </div>
  );
}

function ReplyBox({ value, onChange, onSubmit, onCancel, submitting }: { value: string; onChange: (v: string) => void; onSubmit: () => void; onCancel: () => void; submitting: boolean }) {
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="Write an insight..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={submitting || !value.trim()}><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ComposerModal({ title, children, onClose, onSubmit, submitting, submitLabel }: { title: string; children: ReactNode; onClose: () => void; onSubmit: () => void; submitting: boolean; submitLabel: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <Card className="w-full max-w-xl rounded-2xl border-none shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-950">{title}</h3>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">{children}</div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>;
}
