import type { Metadata } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'All Courses',
  description:
    'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Mathlab.',
  alternates: { canonical: absoluteSiteUrl('/courses') },
  openGraph: {
    title: 'All Courses | Mathlab',
    description:
      'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Mathlab.',
    url: absoluteSiteUrl('/courses'),
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
