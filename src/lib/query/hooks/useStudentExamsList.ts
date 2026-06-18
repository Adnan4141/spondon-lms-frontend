'use client';

import { useQuery } from '@tanstack/react-query';
import { getStudentExams } from '@/lib/api/exams';

export function useStudentExamsList(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student', 'exams', studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const res = await getStudentExams(studentId!);
      if (!res.success) throw new Error(res.message || 'Failed to load exams');
      return res.data ?? [];
    },
  });
}
