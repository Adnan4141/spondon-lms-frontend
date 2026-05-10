import type { Metadata } from 'next';
import { AdminLayout } from '@/features/admin/shared';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
