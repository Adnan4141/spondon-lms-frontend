import type { Metadata } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Books & eBooks',
  description:
    'Explore SSC and HSC academic books, eBooks, and study materials from Mathlab.',
  alternates: { canonical: absoluteSiteUrl('/books') },
  openGraph: {
    title: 'Books & eBooks | Mathlab',
    description:
      'Explore SSC and HSC academic books, eBooks, and study materials from Mathlab.',
    url: absoluteSiteUrl('/books'),
  },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
