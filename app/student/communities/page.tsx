'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCommunities,
  addCommunityMember,
  removeCommunityMember,
  type Community,
} from '@/lib/api/community';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  Search,
  Globe,
  Lock,
  BookOpen,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function StudentCommunitiesPage() {
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUserId(parsed.id);
      } catch {}
    }
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await getCommunities({ status: 'ACTIVE' });
      if (response.success && response.data) {
        setCommunities(response.data);
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoinCommunity = async (community: Community) => {
    if (!userId) {
      toast({ title: 'Error', description: 'Please login to join communities', variant: 'destructive' });
      return;
    }

    try {
      const response = await addCommunityMember({
        communityId: community.id,
        userId,
        role: 'MEMBER',
      });

      if (response.success) {
        toast({ title: 'Success', description: 'Joined community successfully!' });
        loadCommunities();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to join', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleLeaveCommunity = async (community: Community) => {
    if (!userId) return;

    // Find the member record for this user
    const memberRecord = community.members?.find(m => m.userId === userId);
    if (!memberRecord) return;

    try {
      const response = await removeCommunityMember(memberRecord.id);
      if (response.success) {
        toast({ title: 'Success', description: 'Left community successfully' });
        loadCommunities();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to leave', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleViewCommunity = (community: Community) => {
    router.push(`/student/communities/${community.slug}`);
  };

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getVisibilityIcon = (visibility: string) => {
    if (visibility === 'PUBLIC') return <Globe className="h-4 w-4" />;
    if (visibility === 'COURSE_ONLY') return <BookOpen className="h-4 w-4" />;
    return <Lock className="h-4 w-4" />;
  };

  const isUserMember = (community: Community) => {
    return community.members?.some(m => m.userId === userId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Communities</h1>
          <p className="text-slate-600 mt-2">Join communities and connect with fellow students</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading communities...</div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No communities found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => {
              const isMember = isUserMember(community);
              return (
                <div
                  key={community.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewCommunity(community)}
                >
                  {/* Thumbnail */}
                  {community.thumbnail ? (
                    <img
                      src={community.thumbnail}
                      alt={community.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Users className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900">{community.name}</h3>
                      {getVisibilityIcon(community.visibility)}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {community.description || 'No description'}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {community._count?.members || 0} members
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {community._count?.posts || 0} posts
                      </div>
                    </div>

                    {/* Course Badge */}
                    {community.course && (
                      <Badge className="mb-4 bg-blue-50 text-blue-700">
                        {community.course.name}
                      </Badge>
                    )}

                    {/* Action Button */}
                    {isMember ? (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveCommunity(community);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                        Leave Community
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Join Community
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Toaster toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
}
