import type { Metadata } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Mathlab Academic & Admission Program. Founded in 2019, we now serve 100,000+ students with 150+ expert instructors across Bangladesh.',
  alternates: { canonical: absoluteSiteUrl('/about-us') },
  openGraph: {
    title: 'About Us | Mathlab',
    description:
      'Founded in 2019 with 700 students and 3 teachers, Mathlab now serves 100,000+ students with 150+ instructors across Bangladesh.',
    url: absoluteSiteUrl('/about-us'),
  },
};

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
