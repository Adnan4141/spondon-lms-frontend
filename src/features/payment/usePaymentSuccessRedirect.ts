'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPaymentSuccessDestination } from './payment-utils';

export function usePaymentSuccessRedirect(input: {
  verifying: boolean;
  role: string | null;
  invoiceId: string | null;
  redirectHref: string;
  delayMs?: number;
}) {
  const router = useRouter();
  const delayMs = input.delayMs ?? 3000;

  useEffect(() => {
    if (!input.verifying) {
      const dest = getPaymentSuccessDestination(input.role, input.invoiceId, input.redirectHref);
      const timer = setTimeout(() => router.replace(dest), delayMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [input.verifying, input.role, input.invoiceId, input.redirectHref, delayMs, router]);
}
