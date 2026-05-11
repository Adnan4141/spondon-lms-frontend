'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDoubtsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem('student-community-tab', 'doubts');
    router.replace('/student/community');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
      Opening Q&A...
    </div>
  );
}
