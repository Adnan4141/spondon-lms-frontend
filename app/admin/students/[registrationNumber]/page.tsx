'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const StudentDetailPageContent = dynamic(
  () => import('@/features/admin/students/StudentDetailPageContent').then((m) => m.StudentDetailPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading student…
      </div>
    ),
  },
);

export default function StudentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
          Loading student…
        </div>
      }
    >
      <StudentDetailPageContent />
    </Suspense>
  );
}
