'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ReportsPageContent = dynamic(
  () => import('@/features/admin/reports/ReportsPageContent').then((m) => m.ReportsPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading reports…
      </div>
    ),
  },
);

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
          Loading reports…
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
