import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Books & eBooks',
  description:
    'Explore SSC and HSC academic books, eBooks, and study materials from Mathlab.',
  alternates: { canonical: 'https://spondonedu.com/books' },
  openGraph: {
    title: 'Books & eBooks | Mathlab',
    description:
      'Explore SSC and HSC academic books, eBooks, and study materials from Mathlab.',
    url: 'https://spondonedu.com/books',
  },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
