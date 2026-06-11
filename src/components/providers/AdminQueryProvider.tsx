'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createAdminQueryClient } from '@/lib/query/client';

export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createAdminQueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
