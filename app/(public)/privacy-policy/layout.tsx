import type { Metadata } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the privacy policy of Mathlab Academic & Admission Program to understand how we collect, use, and protect your personal information.',
  alternates: { canonical: absoluteSiteUrl('/privacy-policy') },
  robots: { index: true, follow: false },
  openGraph: {
    title: 'Privacy Policy | Mathlab',
    description:
      'Read the privacy policy of Mathlab Academic & Admission Program to understand how we collect, use, and protect your personal information.',
    url: absoluteSiteUrl('/privacy-policy'),
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
