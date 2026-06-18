import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Courses',
  description:
    'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Spondon Academic.',
  alternates: { canonical: 'https://spondonedu.com/courses' },
  openGraph: {
    title: 'All Courses | Spondon Academic',
    description:
      'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Spondon Academic.',
    url: 'https://spondonedu.com/courses',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
