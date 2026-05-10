import { apiRequest } from '../api';

export interface PublicTeacher {
  id: string;
  fullName: string;
  profileImage?: string | null;
  designation?: string | null;
  institute?: string | null;
  experienceYears?: number | null;
  demoClassUrl?: string | null;
  mobile?: string | null;
  updatedAt?: string;
  courses: Array<{
    id: string;
    slug?: string;
    name: string;
    description?: string;
    fee?: number | string;
    thumbnail?: string;
  }>;
}

export async function getPublicTeachers(): Promise<{ success: boolean; data: PublicTeacher[] }> {
  return apiRequest('/users/teachers/public');
}

export async function getPublicTeacherById(id: string): Promise<{ success: boolean; data: PublicTeacher }> {
  return apiRequest(`/users/teachers/public/${id}`);
}
