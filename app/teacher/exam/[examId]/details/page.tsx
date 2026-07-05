'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examBasePath } from '@/features/admin/exam-engine/exam-portal-paths';

export default function TeacherExamDetailsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  useEffect(() => {
    if (examId) router.replace(examBasePath('teacher', examId));
  }, [examId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening exam overview…
    </div>
  );
}
