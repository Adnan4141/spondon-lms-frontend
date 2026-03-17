import { apiRequest } from '../api';

export const getCourseSchedules = (courseId: string) =>
  apiRequest<any>(`/course-schedules/course/${courseId}`);

export const createCourseSchedule = (data: {
  courseId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
}) =>
  apiRequest<any>('/course-schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCourseSchedule = (id: string, data: Partial<{
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
}>) =>
  apiRequest<any>(`/course-schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCourseSchedule = (id: string) =>
  apiRequest<any>(`/course-schedules/${id}`, { method: 'DELETE' });
