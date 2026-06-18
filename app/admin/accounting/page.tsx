'use client';

import dynamic from 'next/dynamic';

const AccountingPageContent = dynamic(
  () =>
    import('@/features/admin/accounting/AccountingPageContent').then((m) => m.AccountingPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading accounting…
      </div>
    ),
  },
);

export default function AdminAccountingPage() {
  return <AccountingPageContent />;
}
