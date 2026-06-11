'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const RoutinePageContent = dynamic(
  () => import('@/features/admin/routine/RoutinePageContent').then((m) => m.RoutinePageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading routine…
      </div>
    ),
  },
);

export default function AdminRoutinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
          Loading routine…
        </div>
      }
    >
      <RoutinePageContent />
    </Suspense>
  );
}
