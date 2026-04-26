'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

type ToastFn = ReturnType<typeof useToast>['toast'];

const AdminToastContext = createContext<ToastFn | undefined>(undefined);

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
      const msg = (e as CustomEvent<string>).detail;
      if (msg) {
        toast({
          title: 'Something went wrong',
          description: msg,
          variant: 'destructive',
        });
      }
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
