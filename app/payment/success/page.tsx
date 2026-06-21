'use client';

import { Suspense } from 'react';
import { PaymentSuccessContent } from '@/features/payment/PaymentSuccessContent';

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
