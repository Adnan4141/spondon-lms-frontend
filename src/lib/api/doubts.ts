import { apiRequest } from '../api';

export interface DoubtThread {
  id: string;
  studentUserId: string;
  courseId?: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  student?: { id: string; fullName: string; profileImage?: string; mobile?: string };
  course?: { id: string; name: string; slug?: string };
  _count?: { replies?: number };
  hasTeacherReply?: boolean;
}

export interface DoubtReply {
  id: string;
  threadId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  author?: { id: string; fullName: string; role?: string; profileImage?: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function getDoubtThreads(params?: {
  studentUserId?: string;
  courseId?: string;
  teacherUserId?: string;
  status?: string;
  search?: string;
  needsResponse?: boolean;
}): Promise<ApiResponse<DoubtThread[]>> {
  const q = new URLSearchParams();
  if (params?.studentUserId) q.append('studentUserId', params.studentUserId);
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  if (params?.status) q.append('status', params.status);
  if (params?.search) q.append('search', params.search);
  if (params?.needsResponse) q.append('needsResponse', 'true');
  const query = q.toString();
  return apiRequest<ApiResponse<DoubtThread[]>>(`/doubts/threads${query ? `?${query}` : ''}`);
}

export async function getDoubtThreadById(id: string): Promise<ApiResponse<DoubtThread>> {
  return apiRequest<ApiResponse<DoubtThread>>(`/doubts/threads/${id}`);
}

export async function updateDoubtThread(
  id: string,
  data: {
    title?: string;
    body?: string;
    status?: 'OPEN' | 'RESOLVED' | 'CLOSED' | string;
  }
): Promise<ApiResponse<DoubtThread>> {
  return apiRequest<ApiResponse<DoubtThread>>(`/doubts/threads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createDoubtThread(data: {
  studentUserId: string;
  courseId?: string;
  title: string;
  body: string;
  status?: string;
}): Promise<ApiResponse<DoubtThread>> {
  return apiRequest<ApiResponse<DoubtThread>>('/doubts/threads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDoubtReplies(threadId: string): Promise<ApiResponse<DoubtReply[]>> {
  return apiRequest<ApiResponse<DoubtReply[]>>(`/doubts/threads/${threadId}/replies`);
}

export async function createDoubtReply(data: {
  threadId: string;
  authorUserId: string;
  body: string;
}): Promise<ApiResponse<DoubtReply>> {
  return apiRequest<ApiResponse<DoubtReply>>('/doubts/replies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
