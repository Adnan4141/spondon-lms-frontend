import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Courses',
  description:
    'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Mathlab.',
  alternates: { canonical: 'https://spondonedu.com/courses' },
  openGraph: {
    title: 'All Courses | Mathlab',
    description:
      'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Mathlab.',
    url: 'https://spondonedu.com/courses',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
