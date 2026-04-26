'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** PDF actions live on the details page (#exam-pdfs). This route keeps a stable “PDF hub” link. */
export default function AdminExamPdfRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  useEffect(() => {
    if (examId) router.replace(`/admin/exam/${examId}/details#exam-pdfs`);
  }, [examId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening PDF section…
    </div>
  );
}
