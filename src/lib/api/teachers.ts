import { apiRequest } from '../api';

export interface PublicTeacher {
  id: string;
  fullName: string;
  profileImage?: string | null;
  courses: Array<{ id: string; name: string; code?: string }>;
}

export async function getPublicTeachers(): Promise<{ success: boolean; data: PublicTeacher[] }> {
  return apiRequest('/users/teachers/public');
}
