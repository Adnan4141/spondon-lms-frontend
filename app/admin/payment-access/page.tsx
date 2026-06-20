'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PaymentAccessPageContent = dynamic(
  () => import('@/features/admin/payment-access/PaymentAccessPageContent').then((m) => m.PaymentAccessPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading payment access…
      </div>
    ),
  },
);

export default function AdminPaymentAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
          Loading payment access…
        </div>
      }
    >
      <PaymentAccessPageContent />
    </Suspense>
  );
}
