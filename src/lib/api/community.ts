import { apiRequest } from '../api';

export interface CommunityPost {
  id: string;
  authorId: string;
  communityId?: string;
  courseId?: string;
  batchId?: string;
  visibility: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | string;
  isPinned?: boolean;
  title: string;
  body: string;
  attachments?: CommunityAttachment[] | CommunityAttachment | Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  author?: { id: string; fullName: string; role?: string; profileImage?: string };
  community?: { id: string; name: string; slug?: string };
  course?: { id: string; name: string; slug?: string };
  batch?: { id: string; name: string };
  replies?: CommunityReply[];
  votes?: CommunityVote[];
  _count?: { replies?: number; votes?: number };
}

export type CommunityAttachment =
  | { type: 'image'; url: string; alt?: string; title?: string; mimeType?: string; size?: number }
  | { type: 'video'; url: string; thumbnail?: string; title?: string; mimeType?: string; size?: number }
  | { type: 'link'; url: string; title?: string; description?: string; image?: string; mimeType?: string; size?: number };

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: { id: string; fullName: string; profileImage?: string | null };
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

export async function getCommunityPosts(params?: {
  communityId?: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  isPinned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<CommunityPost[]> & { pagination?: { page: number; limit: number; total: number; pages: number } }> {
  const q = new URLSearchParams();
  if (params?.communityId) q.append('communityId', params.communityId);
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.batchId) q.append('batchId', params.batchId);
  if (params?.status) q.append('status', params.status);
  if (typeof params?.isPinned === 'boolean') q.append('isPinned', String(params.isPinned));
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const query = q.toString();
  return apiRequest(`/community/posts${query ? `?${query}` : ''}`);
}

export async function createCommunityPost(data: {
  authorId: string;
  communityId?: string;
  courseId?: string;
  batchId?: string;
  visibility?: 'PUBLIC' | 'COURSE_ONLY' | 'BATCH_ONLY';
  title: string;
  body: string;
  attachments?: CommunityPost['attachments'];
}): Promise<ApiResponse<CommunityPost>> {
  return apiRequest<ApiResponse<CommunityPost>>('/community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadCommunityAttachment(file: File): Promise<ApiResponse<CommunityAttachment>> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<ApiResponse<CommunityAttachment>>('/community/attachments', {
    method: 'POST',
    body: formData,
  });
}

export async function seedDemoCommunities(createdById?: string): Promise<ApiResponse<{
  communities: Array<{ id: string; slug: string; name: string }>;
  membersCreated: number;
  postsCreated: number;
  doubtsCreated: number;
}>> {
  return apiRequest<ApiResponse<{
    communities: Array<{ id: string; slug: string; name: string }>;
    membersCreated: number;
    postsCreated: number;
    doubtsCreated: number;
  }>>('/seed/communities', {
    method: 'POST',
    body: JSON.stringify({ createdById }),
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

export async function updateCommunityPost(
  id: string,
  data: {
    communityId?: string | null;
    courseId?: string;
    batchId?: string;
    visibility?: 'PUBLIC' | 'COURSE_ONLY' | 'BATCH_ONLY';
    status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | string;
    isPinned?: boolean;
    title?: string;
    body?: string;
    attachments?: unknown;
  }
): Promise<ApiResponse<CommunityPost>> {
  return apiRequest<ApiResponse<CommunityPost>>(`/community/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCommunityPost(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/community/posts/${id}`, {
    method: 'DELETE',
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
