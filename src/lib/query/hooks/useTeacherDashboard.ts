'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/api/courses';
import { getDoubtThreads } from '@/lib/api/doubts';
import { currentTeacherStudentsMonth, getTeacherStudentsSummary } from '@/lib/api/teacher-students';
import { getExams } from '@/lib/api/exams';
import { getRoutineSlots } from '@/lib/api/routine';

export function useTeacherDashboard(teacherUserId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-dashboard', teacherUserId],
    enabled: Boolean(teacherUserId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!teacherUserId) throw new Error('Not authenticated');

      const [courseRes, doubtRes, routineRes, studentRes, examRes] = await Promise.all([
        getCourses({ teacherUserId, limit: 100 }),
        getDoubtThreads({ teacherUserId, status: 'OPEN', needsResponse: true }),
        getRoutineSlots({ teacherUserId, isActive: true }),
        getTeacherStudentsSummary({ month: currentTeacherStudentsMonth() }),
        getExams({ teacherUserId, limit: 500 }),
      ]);

      const courses = courseRes.success && courseRes.data ? courseRes.data : [];
      const doubts = doubtRes.success && doubtRes.data ? doubtRes.data : [];
      const routine = routineRes.success && routineRes.data ? routineRes.data : [];
      const studentCount =
        studentRes.success && studentRes.data ? studentRes.data.uniqueStudents : 0;
      const exams = examRes.success && examRes.data ? examRes.data : [];

      const examStats = {
        draft: exams.filter((e) => e.status === 'DRAFT').length,
        published: exams.filter((e) => e.status === 'PUBLISHED').length,
      };

      return { courses, doubts, routine, studentCount, examStats };
    },
  });
}
