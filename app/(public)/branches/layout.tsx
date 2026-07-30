import type { Metadata } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Our Branches',
  description:
    'Find Mathlab branch locations across Bangladesh. Visit us for in-person SSC and HSC coaching.',
  alternates: { canonical: absoluteSiteUrl('/branches') },
  openGraph: {
    title: 'Our Branches | Mathlab',
    description:
      'Find Mathlab branch locations across Bangladesh. Visit us for in-person SSC and HSC coaching.',
    url: absoluteSiteUrl('/branches'),
  },
};

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
