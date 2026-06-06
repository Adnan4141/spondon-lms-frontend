import { getLandingPageData } from '@/lib/api/landing-data';
import LandingPageClient from './page.client';

export const revalidate = 300;

export default async function LandingPage() {
  const data = await getLandingPageData();
  return <LandingPageClient {...data} />;
}
