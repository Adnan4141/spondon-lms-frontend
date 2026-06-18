import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Books & eBooks',
  description:
    'Explore SSC and HSC academic books, eBooks, and study materials from Spondon Academic.',
  alternates: { canonical: 'https://spondonedu.com/books' },
  openGraph: {
    title: 'Books & eBooks | Spondon Academic',
    description:
      'Explore SSC and HSC academic books, eBooks, and study materials from Spondon Academic.',
    url: 'https://spondonedu.com/books',
  },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
