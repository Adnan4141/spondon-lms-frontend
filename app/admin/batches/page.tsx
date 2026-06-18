'use client';

import dynamic from 'next/dynamic';

const BatchesPageContent = dynamic(
  () => import('@/features/admin/batches/BatchesPageContent').then((m) => m.BatchesPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading batches…
      </div>
    ),
  },
);

export default function BatchesPage() {
  return <BatchesPageContent />;
}
