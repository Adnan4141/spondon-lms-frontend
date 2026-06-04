'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function WrittenExamRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/student/exams/${id}`);
  }, [id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-500">Opening unified exam page...</p>
      </div>
    </div>
  );
}
