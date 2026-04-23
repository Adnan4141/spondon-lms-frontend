import { apiRequest, API_ORIGIN } from '../api';
import type {
  ApiResponse,
  Question,
  QuestionFolder,
  McqPassage,
  CreateQuestionFolderDto,
  UpdateQuestionFolderDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  CopyQuestionDto,
  BulkCopyQuestionsDto,
  BulkDeleteQuestionsDto,
} from '@/types/question';

export async function getQuestionFolders(
  courseId?: string,
  parentFolderId?: string,
  teacherUserId?: string
): Promise<ApiResponse<QuestionFolder[]>> {
  const queryParams = new URLSearchParams();
  if (courseId) queryParams.append('courseId', courseId);
  if (parentFolderId) queryParams.append('parentFolderId', parentFolderId);
  if (teacherUserId) queryParams.append('teacherUserId', teacherUserId);

  const query = queryParams.toString();
  return apiRequest<ApiResponse<QuestionFolder[]>>(`/question-bank/folders${query ? `?${query}` : ''}`);
}

export async function getQuestionFolderById(id: string): Promise<ApiResponse<QuestionFolder>> {
  return apiRequest<ApiResponse<QuestionFolder>>(`/question-bank/folders/${id}`);
}

export async function createQuestionFolder(data: CreateQuestionFolderDto): Promise<ApiResponse<QuestionFolder>> {
  return apiRequest<ApiResponse<QuestionFolder>>('/question-bank/folders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuestionFolder(id: string, data: UpdateQuestionFolderDto): Promise<ApiResponse<QuestionFolder>> {
  return apiRequest<ApiResponse<QuestionFolder>>(`/question-bank/folders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteQuestionFolder(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/question-bank/folders/${id}`, {
    method: 'DELETE',
  });
}

export async function moveQuestionFolder(
  id: string,
  newParentId: string | null,
): Promise<ApiResponse<QuestionFolder>> {
  return apiRequest<ApiResponse<QuestionFolder>>(`/question-bank/folders/${id}/move`, {
    method: 'POST',
    body: JSON.stringify({ newParentId }),
  });
}

export async function getQuestionFolderDescendants(
  id: string,
): Promise<ApiResponse<{ folderId: string; folderIds: string[]; count: number }>> {
  return apiRequest<ApiResponse<{ folderId: string; folderIds: string[]; count: number }>>(
    `/question-bank/folders/${id}/descendants`,
  );
}

export async function getQuestions(
  folderId?: string,
  type?: string,
  difficulty?: string,
  year?: number,
  tag?: string,
  mcqType?: string,
  passageId?: string,
  folderIds?: string[]
): Promise<ApiResponse<Question[]>> {
  const queryParams = new URLSearchParams();
  if (folderId) queryParams.append('folderId', folderId);
  if (folderIds && folderIds.length > 0) queryParams.append('folderIds', folderIds.join(','));
  if (type) queryParams.append('type', type);
  if (difficulty) queryParams.append('difficulty', difficulty);
  if (year) queryParams.append('year', String(year));
   if (tag) queryParams.append('tag', tag);
  if (mcqType) queryParams.append('mcqType', mcqType);
  if (passageId) queryParams.append('passageId', passageId);

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Question[]>>(`/question-bank/questions${query ? `?${query}` : ''}`);
}

export async function getQuestionById(id: string): Promise<ApiResponse<Question>> {
  return apiRequest<ApiResponse<Question>>(`/question-bank/questions/${id}`);
}

export async function createQuestion(data: CreateQuestionDto): Promise<ApiResponse<Question>> {
  return apiRequest<ApiResponse<Question>>('/question-bank/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuestion(id: string, data: UpdateQuestionDto): Promise<ApiResponse<Question>> {
  return apiRequest<ApiResponse<Question>>(`/question-bank/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteQuestion(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/question-bank/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
}

export async function copyQuestion(data: CopyQuestionDto): Promise<ApiResponse<Question>> {
  return apiRequest<ApiResponse<Question>>('/question-bank/questions/copy', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface FolderTreeNode {
  id: string;
  name: string;
  courseId: string | null;
  parentFolderId: string | null;
  childCount: number;
  questionCount: number;
  counts: { mcqSingle: number; mcqPassage: number; cq: number; short: number; total: number };
  children: FolderTreeNode[];
}

export async function getQuestionFolderTree(
  courseId?: string,
  teacherUserId?: string
): Promise<ApiResponse<FolderTreeNode[]>> {
  const queryParams = new URLSearchParams();
  if (courseId) queryParams.append('courseId', courseId);
  if (teacherUserId) queryParams.append('teacherUserId', teacherUserId);
  const query = queryParams.toString();
  return apiRequest<ApiResponse<FolderTreeNode[]>>(`/question-bank/folders/tree${query ? `?${query}` : ''}`);
}

export async function bulkCopyQuestions(data: BulkCopyQuestionsDto): Promise<ApiResponse<Question[]>> {
  return apiRequest<ApiResponse<Question[]>>('/question-bank/questions/bulk-copy', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkDeleteQuestions(
  data: BulkDeleteQuestionsDto,
): Promise<ApiResponse<{ deleted: number }>> {
  return apiRequest<ApiResponse<{ deleted: number }>>('/question-bank/questions/bulk-delete', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

// Rich text editor image upload
export async function uploadQuestionImage(
  file: File
): Promise<{ success: boolean; data?: { url: string }; message?: string; error?: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiRequest<{
    success: boolean;
    data?: { url: string };
    message?: string;
    error?: string;
  }>('/question-bank/questions/upload-image', {
    method: 'POST',
    body: formData,
  });

  // Ensure URL is absolute so images load from backend origin, not Next.js origin
  if (response.success && response.data?.url) {
    const url = response.data.url;
    if (url.startsWith('/')) {
      response.data.url = `${API_ORIGIN}${url}`;
    }
  }

  return response;
}

// Passage (group MCQ) APIs
export async function getPassages(
  folderId?: string,
  folderIds?: string[]
): Promise<ApiResponse<McqPassage[]>> {
  const queryParams = new URLSearchParams();
  if (folderId) queryParams.append('folderId', folderId);
  if (folderIds && folderIds.length > 0) queryParams.append('folderIds', folderIds.join(','));
  const query = queryParams.toString();
  return apiRequest<ApiResponse<McqPassage[]>>(`/question-bank/passages${query ? `?${query}` : ''}`);
}

export async function getPassageById(id: string): Promise<ApiResponse<McqPassage>> {
  return apiRequest<ApiResponse<McqPassage>>(`/question-bank/passages/${id}`);
}

export async function createPassage(data: {
  folderId: string;
  title?: string;
  content: string;
  difficulty?: string;
  year?: number;
  tags?: string[];
}): Promise<ApiResponse<McqPassage>> {
  return apiRequest<ApiResponse<McqPassage>>('/question-bank/passages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePassage(
  id: string,
  data: {
    folderId?: string;
    title?: string;
    content?: string;
    difficulty?: string;
    year?: number;
    tags?: string[];
  }
): Promise<ApiResponse<McqPassage>> {
  return apiRequest<ApiResponse<McqPassage>>(`/question-bank/passages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePassage(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/question-bank/passages/${id}`, {
    method: 'DELETE',
  });
}

export async function copyPassage(
  passageId: string,
  targetFolderId: string,
): Promise<ApiResponse<McqPassage>> {
  return apiRequest<ApiResponse<McqPassage>>(`/question-bank/passages/${encodeURIComponent(passageId)}/copy`, {
    method: 'POST',
    body: JSON.stringify({ targetFolderId }),
  });
}

export async function createPassageWithQuestions(data: {
  folderId: string;
  title?: string;
  content: string;
  difficulty?: string;
  year?: number;
  tags?: string[];
  questions: Array<{
    prompt: string;
    explanation?: string;
    difficulty?: string;
    year?: number;
    tags?: string[];
    options?: Array<{ label: string; text: string; isCorrect?: boolean }>;
  }>;
}): Promise<ApiResponse<McqPassage>> {
  return apiRequest<ApiResponse<McqPassage>>('/question-bank/passages/with-questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePassageWithQuestions(
  id: string,
  data: {
    folderId?: string;
    title?: string;
    content?: string;
    difficulty?: string;
    year?: number;
    tags?: string[];
    questions: Array<{
      id?: string;
      prompt: string;
      explanation?: string;
      difficulty?: string;
      year?: number;
      tags?: string[];
      options?: Array<{ label: string; text: string; isCorrect?: boolean }>;
    }>;
  }
): Promise<ApiResponse<McqPassage>> {
  return apiRequest<ApiResponse<McqPassage>>(`/question-bank/passages/${id}/with-questions`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
