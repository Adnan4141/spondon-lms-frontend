import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Mathlab Academic & Admission Program. Founded in 2019, we now serve 100,000+ students with 150+ expert instructors across Bangladesh.',
  alternates: { canonical: 'https://spondonedu.com/about-us' },
  openGraph: {
    title: 'About Us | Mathlab',
    description:
      'Founded in 2019 with 700 students and 3 teachers, Mathlab now serves 100,000+ students with 150+ instructors across Bangladesh.',
    url: 'https://spondonedu.com/about-us',
  },
};

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
