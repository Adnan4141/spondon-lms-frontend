import { apiRequest } from '../api';

export interface CommunityPost {
  id: string;
  authorId: string;
  courseId?: string;
  batchId?: string;
  visibility: string;
  title: string;
  body: string;
  attachments?: any;
  createdAt: string;
  author?: { id: string; fullName: string; role?: string };
  course?: { id: string; name: string; slug?: string };
  batch?: { id: string; name: string };
  replies?: CommunityReply[];
  votes?: CommunityVote[];
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: { id: string; fullName: string };
}

export interface CommunityVote {
  id: string;
  postId: string;
  userId: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function getCommunityPosts(params?: { courseId?: string; batchId?: string }): Promise<ApiResponse<CommunityPost[]>> {
  const q = new URLSearchParams();
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.batchId) q.append('batchId', params.batchId);
  const query = q.toString();
  return apiRequest<ApiResponse<CommunityPost[]>>(`/community/posts${query ? `?${query}` : ''}`);
}

export async function createCommunityPost(data: {
  authorId: string;
  communityId?: string;
  courseId?: string;
  batchId?: string;
  visibility?: 'PUBLIC' | 'COURSE_ONLY' | 'BATCH_ONLY';
  title: string;
  body: string;
  attachments?: any;
}): Promise<ApiResponse<CommunityPost>> {
  return apiRequest<ApiResponse<CommunityPost>>('/community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createCommunityReply(data: { postId: string; authorId: string; body: string }): Promise<ApiResponse<CommunityReply>> {
  return apiRequest<ApiResponse<CommunityReply>>('/community/replies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createCommunityVote(data: { postId: string; userId: string; value: number }): Promise<ApiResponse<CommunityVote>> {
  return apiRequest<ApiResponse<CommunityVote>>('/community/votes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteCommunityVote(postId: string, userId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/community/votes?postId=${encodeURIComponent(postId)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

// ─── Community Management (Admin) ────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  courseId?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'COURSE_ONLY' | 'MEMBERS_ONLY';
  createdAt: string;
  updatedAt: string;
  createdById: string;
  course?: { id: string; name: string };
  createdBy?: { id: string; fullName: string };
  members?: CommunityMember[];
  _count?: { members: number; posts: number };
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user?: {
    id: string;
    fullName: string;
    profileImage?: string;
    role: string;
    email?: string;
    mobile?: string;
  };
}

export async function getCommunities(params?: {
  status?: string;
  visibility?: string;
  courseId?: string;
}): Promise<ApiResponse<Community[]>> {
  const q = new URLSearchParams();
  if (params?.status) q.append('status', params.status);
  if (params?.visibility) q.append('visibility', params.visibility);
  if (params?.courseId) q.append('courseId', params.courseId);
  const query = q.toString();
  return apiRequest<ApiResponse<Community[]>>(`/community/communities${query ? `?${query}` : ''}`);
}

export async function getCommunityById(id: string): Promise<ApiResponse<Community>> {
  return apiRequest<ApiResponse<Community>>(`/community/communities/${id}`);
}

export async function createCommunity(data: {
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  courseId?: string;
  visibility?: 'PUBLIC' | 'COURSE_ONLY' | 'MEMBERS_ONLY';
  createdById: string;
}): Promise<ApiResponse<Community>> {
  return apiRequest<ApiResponse<Community>>('/community/communities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCommunity(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    thumbnail?: string;
    courseId?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
    visibility?: 'PUBLIC' | 'COURSE_ONLY' | 'MEMBERS_ONLY';
  }
): Promise<ApiResponse<Community>> {
  return apiRequest<ApiResponse<Community>>(`/community/communities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCommunity(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/community/communities/${id}`, {
    method: 'DELETE',
  });
}

// Community Members

export async function getCommunityMembers(communityId: string): Promise<ApiResponse<CommunityMember[]>> {
  return apiRequest<ApiResponse<CommunityMember[]>>(`/community/communities/${communityId}/members`);
}

export async function addCommunityMember(data: {
  communityId: string;
  userId: string;
  role?: string;
}): Promise<ApiResponse<CommunityMember>> {
  return apiRequest<ApiResponse<CommunityMember>>('/community/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCommunityMember(
  id: string,
  data: { role: string }
): Promise<ApiResponse<CommunityMember>> {
  return apiRequest<ApiResponse<CommunityMember>>(`/community/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function removeCommunityMember(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/community/members/${id}`, {
    method: 'DELETE',
  });
}

// Get posts by community

export async function getCommunityPostsByCommunity(
  communityId: string,
  params?: { status?: string }
): Promise<ApiResponse<CommunityPost[]>> {
  const q = new URLSearchParams();
  if (params?.status) q.append('status', params.status);
  const query = q.toString();
  return apiRequest<ApiResponse<CommunityPost[]>>(`/community/communities/${communityId}/posts${query ? `?${query}` : ''}`);
}
