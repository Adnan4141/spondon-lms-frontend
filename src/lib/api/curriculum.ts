import { apiRequest } from '../api';
import { appendActorUserIdToFormData, getActorUserIdFromStorage, getActorUserIdQuery } from '../actor-user';
import type { ApiResponse } from '@/types/course';

function withActor<T extends Record<string, unknown>>(body: T): T & { actorUserId?: string } {
  const id = getActorUserIdFromStorage();
  return id ? { ...body, actorUserId: id } : body;
}

export type CurriculumTreePayload = {
  course: { id: string; name: string; slug?: string | null } | null;
  tree: unknown[];
};

export async function getCurriculumTree(courseId: string): Promise<ApiResponse<CurriculumTreePayload>> {
  return apiRequest(`/courses/${encodeURIComponent(courseId)}/curriculum`);
}

export async function createCurriculumNode(
  courseId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<unknown>> {
  return apiRequest(`/courses/${encodeURIComponent(courseId)}/curriculum/nodes`, {
    method: 'POST',
    body: JSON.stringify(withActor(body)),
  });
}

export async function updateCurriculumNode(
  nodeId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<unknown>> {
  return apiRequest(`/curriculum/nodes/${encodeURIComponent(nodeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(withActor(body)),
  });
}

export async function deleteCurriculumNode(nodeId: string): Promise<ApiResponse<unknown>> {
  return apiRequest(`/curriculum/nodes/${encodeURIComponent(nodeId)}${getActorUserIdQuery()}`, {
    method: 'DELETE',
  });
}

export async function reorderCurriculum(
  courseId: string,
  items: { id: string; parentId: string | null; sortOrder: number }[],
): Promise<ApiResponse<{ tree: unknown[] }>> {
  return apiRequest(`/courses/${encodeURIComponent(courseId)}/curriculum/reorder`, {
    method: 'PATCH',
    body: JSON.stringify(withActor({ items })),
  });
}

export async function createLessonResource(lessonId: string, formData: FormData): Promise<ApiResponse<unknown>> {
  appendActorUserIdToFormData(formData);
  return apiRequest(`/curriculum/lessons/${encodeURIComponent(lessonId)}/resources`, {
    method: 'POST',
    body: formData,
  });
}

export async function updateLessonResource(resourceId: string, formData: FormData): Promise<ApiResponse<unknown>> {
  appendActorUserIdToFormData(formData);
  return apiRequest(`/curriculum/resources/${encodeURIComponent(resourceId)}`, {
    method: 'PATCH',
    body: formData,
  });
}

export async function deleteLessonResource(resourceId: string): Promise<ApiResponse<unknown>> {
  return apiRequest(`/curriculum/resources/${encodeURIComponent(resourceId)}${getActorUserIdQuery()}`, {
    method: 'DELETE',
  });
}
