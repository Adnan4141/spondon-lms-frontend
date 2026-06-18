import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Branches',
  description:
    'Find Spondon Academic branch locations across Bangladesh. Visit us for in-person SSC and HSC coaching.',
  alternates: { canonical: 'https://spondonedu.com/branches' },
  openGraph: {
    title: 'Our Branches | Spondon Academic',
    description:
      'Find Spondon Academic branch locations across Bangladesh. Visit us for in-person SSC and HSC coaching.',
    url: 'https://spondonedu.com/branches',
  },
};

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
