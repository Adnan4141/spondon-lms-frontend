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
