'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  type Community,
} from '@/lib/api/community';
import { getCourses, type Course } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  MessageSquare,
  Globe,
  Lock,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';
import { useAdminSession } from '@/features/admin/shared/admin-session';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function CommunityForm({
  community,
  onSuccess,
}: {
  community?: Community;
  onSuccess: () => void;
}) {
  const { user } = useAdminSession();
  const { toast } = useToast();
  const { closeModal } = useModalStore();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    name: community?.name || '',
    slug: community?.slug || '',
    description: community?.description || '',
    thumbnail: community?.thumbnail || '',
    courseId: community?.courseId || 'none',
    visibility: community?.visibility || 'PUBLIC',
    status: community?.status || 'ACTIVE',
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await getCourses({ all: true });
        if (res.success && res.data) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    loadCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({ title: 'Error', description: 'Name and slug are required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        courseId: formData.courseId === 'none' ? undefined : formData.courseId,
      };
      if (community?.id) {
        const response = await updateCommunity(community.id, submitData);
        if (response.success) {
          toast({ title: 'Success', description: 'Community updated successfully' });
          onSuccess();
          closeModal();
        } else {
          toast({ title: 'Error', description: response.message || 'Failed to update community', variant: 'destructive' });
        }
      } else {
        if (!user?.id) {
          toast({ title: 'Error', description: 'User session not found', variant: 'destructive' });
          return;
        }
        const response = await createCommunity({ ...submitData, createdById: user.id });
        if (response.success) {
          toast({ title: 'Success', description: 'Community created successfully' });
          onSuccess();
          closeModal();
        } else {
          toast({ title: 'Error', description: response.message || 'Failed to create community', variant: 'destructive' });
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData({ ...formData, slug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter community name"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Slug *</label>
        <div className="flex gap-2">
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="community-slug"
            required
          />
          <Button type="button" variant="outline" onClick={generateSlug}>
            Generate
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Used in URL: /communities/{formData.slug}</p>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full min-h-[100px] rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this community..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Thumbnail URL</label>
        <Input
          value={formData.thumbnail}
          onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Course (Optional)</label>
        <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select course (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Visibility</label>
        <Select value={formData.visibility} onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public - Everyone can see</SelectItem>
            <SelectItem value="COURSE_ONLY">Course Only - Course members only</SelectItem>
            <SelectItem value="MEMBERS_ONLY">Members Only - Joined members only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {community && (
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : community ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default function CommunitiesPage() {
  const router = useRouter();
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');

  const loadCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCommunities();
      if (response.success && response.data) {
        setCommunities(response.data);
      } else {
        setError(response.message || 'Failed to load communities');
        setCommunities([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load communities');
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleCreateCommunity = () => {
    openModal({
      title: 'Create Community',
      description: 'Create a new community for students to collaborate.',
      className: 'sm:max-w-2xl',
      content: <CommunityForm onSuccess={loadCommunities} />,
    });
  };

  const handleEditCommunity = (community: Community) => {
    openModal({
      title: 'Edit Community',
      description: 'Update community information.',
      className: 'sm:max-w-2xl',
      content: <CommunityForm community={community} onSuccess={loadCommunities} />,
    });
  };

  const handleDeleteCommunity = (community: Community) => {
    openModal({
      title: 'Delete Community',
      description: `Delete "${community.name}"? All posts and members will be removed.`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description={`Are you sure you want to delete the community "${community.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              const response = await deleteCommunity(community.id);
              if (response.success) {
                toast({ title: 'Success', description: 'Community deleted successfully' });
                loadCommunities();
              } else {
                toast({ title: 'Error', description: response.message || 'Failed to delete', variant: 'destructive' });
              }
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const handleViewCommunity = (community: Community) => {
    router.push(`/admin/communities/${community.id}`);
  };

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || community.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesVisibility = visibilityFilter === 'all' || community.visibility === visibilityFilter;
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const getVisibilityIcon = (visibility: string) => {
    if (visibility === 'PUBLIC') return <Globe className="h-4 w-4" />;
    if (visibility === 'COURSE_ONLY') return <BookOpen className="h-4 w-4" />;
    return <Lock className="h-4 w-4" />;
  };

  const getVisibilityBadge = (visibility: string) => {
    if (visibility === 'PUBLIC') return <Badge className="bg-blue-50 text-blue-700">Public</Badge>;
    if (visibility === 'COURSE_ONLY') return <Badge className="bg-purple-50 text-purple-700">Course Only</Badge>;
    return <Badge className="bg-slate-50 text-slate-700">Members Only</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') return <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>;
    return <Badge className="bg-slate-50 text-slate-700">Archived</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Communities</h1>
              <p className="text-slate-600 mt-2">Manage student communities and discussions</p>
            </div>
            <Button onClick={handleCreateCommunity} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Community
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="COURSE_ONLY">Course Only</SelectItem>
              <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadCommunities} className="bg-white">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Communities Grid */}
        {loading && !communities.length ? (
          <div className="text-center py-12 text-slate-500">Loading communities...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No communities found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => handleViewCommunity(community)}
              >
                {/* Admin Action Buttons - Top Right Overlay */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 backdrop-blur hover:bg-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCommunity(community);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 backdrop-blur hover:bg-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCommunity(community);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

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

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {community.course && (
                      <Badge className="bg-blue-50 text-blue-700">
                        {community.course.name}
                      </Badge>
                    )}
                    {getVisibilityBadge(community.visibility)}
                    {getStatusBadge(community.status)}
                  </div>

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCommunity(community);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Toaster toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
}
