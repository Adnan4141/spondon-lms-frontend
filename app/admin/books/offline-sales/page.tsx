'use client';

import dynamic from 'next/dynamic';

const OfflineBookSalesPageContent = dynamic(
  () => import('@/features/admin/books/OfflineBookSalesPageContent').then((m) => m.OfflineBookSalesPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading offline sales…
      </div>
    ),
  },
);

export default function OfflineBookSalesPage() {
  return <OfflineBookSalesPageContent />;
}
