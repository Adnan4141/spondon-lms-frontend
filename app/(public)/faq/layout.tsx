import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Mathlab courses, enrollment, payments, and programs for SSC and HSC students in Bangladesh.',
  alternates: { canonical: 'https://spondonedu.com/faq' },
  openGraph: {
    title: 'FAQ | Mathlab',
    description:
      'Frequently asked questions about Mathlab courses, enrollment, payments, and programs for SSC and HSC students in Bangladesh.',
    url: 'https://spondonedu.com/faq',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
