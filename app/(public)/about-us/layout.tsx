import type { Metadata } from 'next';
import { buildAboutMetadata } from '@/lib/seo-brand';

export async function generateMetadata(): Promise<Metadata> {
  return buildAboutMetadata();
}

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
