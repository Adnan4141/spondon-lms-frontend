import { apiRequest } from '../api';

export interface ContentFolder {
  id: string;
  courseId: string;
  parentId?: string | null;
  name: string;
  type: 'VIDEO_FOLDER' | 'PDF_FOLDER' | 'MIXED';
  sortOrder: number;
  createdAt: string;
  children?: ContentFolder[];
  contents?: Array<{ id: string; title: string; type: string }>;
}

export async function getContentFolders(courseId: string) {
  return apiRequest(`/content-folders?courseId=${courseId}`);
}

export async function getContentFolder(id: string) {
  return apiRequest(`/content-folders/${id}`);
}

export async function createContentFolder(data: {
  courseId: string;
  parentId?: string;
  name: string;
  type?: string;
  sortOrder?: number;
}) {
  return apiRequest('/content-folders', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateContentFolder(id: string, data: { name?: string; type?: string; sortOrder?: number }) {
  return apiRequest(`/content-folders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteContentFolder(id: string) {
  return apiRequest(`/content-folders/${id}`, { method: 'DELETE' });
}

export async function moveContentToFolder(data: { contentId: string; folderId: string | null }) {
  return apiRequest('/content-folders/move-content', { method: 'POST', body: JSON.stringify(data) });
}
