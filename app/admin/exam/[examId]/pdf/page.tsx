'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Legacy PDF hub — papers tab is canonical */
export default function AdminExamPdfRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  useEffect(() => {
    if (examId) router.replace(`/admin/exam/${examId}/papers`);
  }, [examId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening papers…
    </div>
  );
}
