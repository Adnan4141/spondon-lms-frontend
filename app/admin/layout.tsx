import type { Metadata } from 'next';
import { ConditionalAdminShell } from '@/features/admin/shared/ConditionalAdminShell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConditionalAdminShell>{children}</ConditionalAdminShell>;
}
