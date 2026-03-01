import { apiRequest } from '../api';
import type {
  ApiResponse,
  Question,
  QuestionFolder,
  CreateQuestionFolderDto,
  UpdateQuestionFolderDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  CopyQuestionDto,
} from '@/types/question';

export async function getQuestionFolders(courseId?: string, parentFolderId?: string): Promise<ApiResponse<QuestionFolder[]>> {
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
  year?: number
): Promise<ApiResponse<Question[]>> {
  const queryParams = new URLSearchParams();
  if (folderId) queryParams.append('folderId', folderId);
  if (type) queryParams.append('type', type);
  if (difficulty) queryParams.append('difficulty', difficulty);
  if (year) queryParams.append('year', String(year));

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
