'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const StudentsPageContent = dynamic(
  () => import('@/features/admin/students/StudentsPageContent').then((m) => m.StudentsPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading students…
      </div>
    ),
  },
);

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
          Loading students…
        </div>
      }
    >
      <StudentsPageContent />
    </Suspense>
  );
}
