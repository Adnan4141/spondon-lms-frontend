'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

type ToastFn = ReturnType<typeof useToast>['toast'];

const AdminToastContext = createContext<ToastFn | undefined>(undefined);

export function useOptionalAdminToast(): ToastFn | undefined {
  return useContext(AdminToastContext);
}

/** Single toast queue for all `/admin` pages (wired to `<Toaster />`). */
export function useAdminToast(): ToastFn {
  const t = useContext(AdminToastContext);
  if (!t) {
    throw new Error('useAdminToast must be used within AdminToastProvider');
  }
  return t;
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const { toast, toasts, removeToast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; status: number } | string>).detail;
      const msg = typeof detail === 'string' ? detail : detail?.message;
      const status = typeof detail === 'object' ? detail?.status : undefined;
      if (!msg) return;

      let title = 'Something went wrong';
      if (status === 503) title = 'Service Unavailable';
      else if (status === 500) title = 'Server Error';
      else if (status === 403) title = 'Access Denied';
      else if (status === 404) title = 'Not Found';

      toast({
        title,
        description: msg,
        variant: 'destructive',
      });
    };
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, [toast]);

  return (
    <AdminToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} removeToast={removeToast} />
    </AdminToastContext.Provider>
  );
}
