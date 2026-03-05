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
} from '@/types/question';

export async function getQuestionFolders(
  courseId?: string,
  parentFolderId?: string
): Promise<ApiResponse<QuestionFolder[]>> {
  const queryParams = new URLSearchParams();
  if (courseId) queryParams.append('courseId', courseId);
  if (parentFolderId) queryParams.append('parentFolderId', parentFolderId);

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

export async function getQuestions(
  folderId?: string,
  type?: string,
  difficulty?: string,
  year?: number,
  tag?: string,
  mcqType?: string,
  passageId?: string
): Promise<ApiResponse<Question[]>> {
  const queryParams = new URLSearchParams();
  if (folderId) queryParams.append('folderId', folderId);
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
  return apiRequest<ApiResponse<void>>(`/question-bank/questions/${id}`, {
    method: 'DELETE',
  });
}

export async function copyQuestion(data: CopyQuestionDto): Promise<ApiResponse<Question>> {
  return apiRequest<ApiResponse<Question>>('/question-bank/questions/copy', {
    method: 'POST',
    body: JSON.stringify(data),
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
  folderId?: string
): Promise<ApiResponse<McqPassage[]>> {
  const queryParams = new URLSearchParams();
  if (folderId) queryParams.append('folderId', folderId);
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
