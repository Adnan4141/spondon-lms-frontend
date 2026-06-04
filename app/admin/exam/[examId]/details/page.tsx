'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Legacy route — canonical overview is /admin/exam/[examId] */
export default function AdminExamDetailsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  useEffect(() => {
    if (examId) router.replace(`/admin/exam/${examId}`);
  }, [examId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening exam overview…
    </div>
  );
}
