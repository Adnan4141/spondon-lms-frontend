'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examPapersPath } from '@/features/admin/exam-engine/exam-portal-paths';

export default function TeacherExamPdfRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  useEffect(() => {
    if (examId) router.replace(examPapersPath('teacher', examId));
  }, [examId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening papers…
    </div>
  );
}
