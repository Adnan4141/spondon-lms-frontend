import { apiRequest } from '../api';

export interface DoubtThread {
  id: string;
  studentUserId: string;
  courseId?: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface DoubtReply {
  id: string;
  threadId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function getDoubtThreads(params?: {
  studentUserId?: string;
  courseId?: string;
  status?: string;
}): Promise<ApiResponse<DoubtThread[]>> {
  const q = new URLSearchParams();
  if (params?.studentUserId) q.append('studentUserId', params.studentUserId);
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.status) q.append('status', params.status);
  const query = q.toString();
  return apiRequest<ApiResponse<DoubtThread[]>>(`/doubts/threads${query ? `?${query}` : ''}`);
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
