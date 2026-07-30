import type { Metadata } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Mathlab courses, enrollment, payments, and programs for SSC and HSC students in Bangladesh.',
  alternates: { canonical: absoluteSiteUrl('/faq') },
  openGraph: {
    title: 'FAQ | Mathlab',
    description:
      'Frequently asked questions about Mathlab courses, enrollment, payments, and programs for SSC and HSC students in Bangladesh.',
    url: absoluteSiteUrl('/faq'),
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
