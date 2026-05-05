'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCommunityById,
  getCommunityMembers,
  addCommunityMember,
  removeCommunityMember,
  updateCommunityMember,
  getCommunityPostsByCommunity,
  type Community,
  type CommunityMember,
  type CommunityPost,
} from '@/lib/api/community';
import { getStudents, type Student } from '@/lib/api/students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  MessageSquare,
  Search,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function AddMemberForm({
  communityId,
  onSuccess,
}: {
  communityId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const { closeModal } = useModalStore();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('MEMBER');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await getStudents({ role: 'STUDENT', limit: 100 });
        if (res.success && res.data) {
          setStudents(res.data);
        }
      } catch (err) {
        console.error('Failed to load students', err);
      }
    };
    loadStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast({ title: 'Error', description: 'Please select a student', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const response = await addCommunityMember({ communityId, userId: selectedUserId, role });
      if (response.success) {
        toast({ title: 'Success', description: 'Member added successfully' });
        onSuccess();
        closeModal();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to add member', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.mobile?.includes(searchQuery)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Search Student</label>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or mobile..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Select Student *</label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {filteredStudents.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.fullName} ({student.mobile})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Role</label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'posts'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [communityRes, membersRes, postsRes] = await Promise.all([
        getCommunityById(id),
        getCommunityMembers(id),
        getCommunityPostsByCommunity(id),
      ]);

      if (communityRes.success && communityRes.data) {
        setCommunity(communityRes.data);
      }
      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data);
      }
      if (postsRes.success && postsRes.data) {
        setPosts(postsRes.data);
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCommunityData();
    }
  }, [id]);

  const handleAddMember = () => {
    openModal({
      title: 'Add Member',
      description: 'Add a new member to this community.',
      className: 'sm:max-w-2xl',
      content: <AddMemberForm communityId={id} onSuccess={loadCommunityData} />,
    });
  };

  const handleRemoveMember = (member: CommunityMember) => {
    openModal({
      title: 'Remove Member',
      description: `Remove ${member.user?.fullName} from this community?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Remove"
          description={`Are you sure you want to remove ${member.user?.fullName} from this community?`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              const response = await removeCommunityMember(member.id);
              if (response.success) {
                toast({ title: 'Success', description: 'Member removed successfully' });
                loadCommunityData();
              } else {
                toast({ title: 'Error', description: response.message || 'Failed to remove', variant: 'destructive' });
              }
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const handleToggleRole = async (member: CommunityMember) => {
    const newRole = member.role === 'MEMBER' ? 'MODERATOR' : 'MEMBER';
    try {
      const response = await updateCommunityMember(member.id, { role: newRole });
      if (response.success) {
        toast({ title: 'Success', description: 'Role updated successfully' });
        loadCommunityData();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to update role', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const filteredMembers = members.filter((m) =>
    m.user?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user?.mobile?.includes(searchQuery)
  );

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !community) {
    return <div className="p-6 text-center">Loading community...</div>;
  }

  if (!community) {
    return <div className="p-6 text-center text-red-500">Community not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{community.name}</h1>
          <p className="text-sm text-slate-600 mt-1">{community.description || 'No description'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-4 w-4" />
            <span className="text-sm">Members</span>
          </div>
          <div className="text-2xl font-bold mt-1">{members.length}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Posts</span>
          </div>
          <div className="text-2xl font-bold mt-1">{posts.length}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-slate-600">Course</div>
          <div className="text-lg font-semibold mt-1">{community.course?.name || '—'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          )}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
            activeTab === 'posts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          )}
        >
          Posts ({posts.length})
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={activeTab === 'members' ? 'Search members...' : 'Search posts...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeTab === 'members' && (
          <Button onClick={handleAddMember} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'members' ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium">{member.user?.fullName || 'Unknown'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{member.user?.mobile || '—'}</div>
                      <div className="text-xs text-slate-500">{member.user?.email || '—'}</div>
                    </TableCell>
                    <TableCell>
                      {member.role === 'MODERATOR' ? (
                        <Badge className="bg-purple-50 text-purple-700 gap-1">
                          <Shield className="h-3 w-3" />
                          Moderator
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-50 text-slate-700">Member</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(member.joinedAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleRole(member)}>
                          <Edit className="h-3 w-3 mr-1" />
                          {member.role === 'MODERATOR' ? 'Make Member' : 'Make Moderator'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No posts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-slate-500 line-clamp-1">{post.body}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{post.author?.fullName || 'Unknown'}</div>
                    </TableCell>
                    <TableCell>{(post as any)._count?.replies || post.replies?.length || 0}</TableCell>
                    <TableCell>{(post as any)._count?.votes || post.votes?.length || 0}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(post.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
