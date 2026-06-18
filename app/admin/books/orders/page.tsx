'use client';

import dynamic from 'next/dynamic';

const OnlineBookOrdersPageContent = dynamic(
  () => import('@/features/admin/books/OnlineBookOrdersPageContent').then((m) => m.OnlineBookOrdersPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading orders…
      </div>
    ),
  },
);

export default function OnlineOrdersPage() {
  return <OnlineBookOrdersPageContent />;
}
