import type { Metadata } from 'next';
import { buildPublicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPublicPageMetadata({
  title: 'আমাদের শিক্ষকমণ্ডলী',
  description:
    'স্পন্দনের অভিজ্ঞ শিক্ষকদের সাথে SSC, HSC ও অ্যাডমিশন প্রোগ্রামে প্রস্তুতি নিন।',
  path: '/teachers',
  imageAlt: 'Spondon Teachers',
});

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
