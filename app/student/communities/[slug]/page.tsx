'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCommunities,
  getCommunityPostsByCommunity,
  createCommunityPost,
  createCommunityReply,
  type Community,
  type CommunityPost,
} from '@/lib/api/community';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  ArrowLeft,
  Send,
  Heart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast, toasts, removeToast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUserId(parsed.id);
        setUserName(parsed.fullName || '');
      } catch {}
    }
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      // Find community by slug
      const communitiesRes = await getCommunities({ status: 'ACTIVE' });
      if (communitiesRes.success && communitiesRes.data) {
        const found = communitiesRes.data.find(c => c.slug === slug);
        if (found) {
          setCommunity(found);
          
          // Load posts
          const postsRes = await getCommunityPostsByCommunity(found.id, { status: 'PUBLISHED' });
          if (postsRes.success && postsRes.data) {
            setPosts(postsRes.data);
          }
        }
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadCommunityData();
    }
  }, [slug]);

  const handleCreatePost = async () => {
    if (!userId || !community || !newPostTitle.trim() || !newPostBody.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const response = await createCommunityPost({
        authorId: userId,
        communityId: community.id,
        title: newPostTitle,
        body: newPostBody,
        visibility: 'PUBLIC',
      });

      if (response.success) {
        toast({ title: 'Success', description: 'Post created successfully!' });
        setNewPostTitle('');
        setNewPostBody('');
        setShowCreatePost(false);
        loadCommunityData();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to create post', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReply = async (postId: string) => {
    if (!userId || !replyBody.trim()) return;

    try {
      setSubmitting(true);
      const response = await createCommunityReply({
        postId,
        authorId: userId,
        body: replyBody,
      });

      if (response.success) {
        toast({ title: 'Success', description: 'Reply posted!' });
        setReplyBody('');
        setReplyingTo(null);
        loadCommunityData();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to reply', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading community...</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Community not found</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Button>

          <div className="bg-white rounded-lg border p-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{community.name}</h1>
            <p className="text-slate-600 mb-4">{community.description || 'No description'}</p>

            <div className="flex gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {community._count?.members || 0} members
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {posts.length} posts
              </div>
            </div>

            {community.course && (
              <Badge className="mt-4 bg-blue-50 text-blue-700">
                {community.course.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Create Post */}
        <div className="mb-6">
          {!showCreatePost ? (
            <Button onClick={() => setShowCreatePost(true)} className="w-full">
              Create New Post
            </Button>
          ) : (
            <div className="bg-white rounded-lg border p-4">
              <Input
                placeholder="Post title..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="mb-3"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                rows={4}
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreatePost} disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-slate-500">
              No posts yet. Be the first to post!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg border p-6">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {post.author?.fullName?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{post.author?.fullName || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{formatTimeAgo(post.createdAt)}</div>
                  </div>
                </div>

                {/* Post Content */}
                <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.body}</p>

                {/* Post Actions */}
                <div className="flex gap-4 text-sm text-slate-500 border-t pt-3">
                  <button className="flex items-center gap-1 hover:text-red-500">
                    <Heart className="h-4 w-4" />
                    {post.votes?.length || 0}
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                    className="flex items-center gap-1 hover:text-blue-500"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post.replies?.length || 0} replies
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === post.id && (
                  <div className="mt-4 border-t pt-4">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateReply(post.id)}
                        disabled={submitting}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                          {reply.author?.fullName?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="font-semibold text-sm">{reply.author?.fullName || 'Unknown'}</div>
                            <p className="text-sm text-slate-700">{reply.body}</p>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{formatTimeAgo(reply.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <Toaster toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
}
