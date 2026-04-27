import { getHeroSlides, type HeroSlide } from '@/lib/api/site-content';
import LandingPageClient from './page.client';

export default async function LandingPage() {
  let initialHeroSlides: HeroSlide[] = [];
  try {
    const res = await getHeroSlides();
    if (res.success && res.data?.length) initialHeroSlides = res.data;
  } catch {
    // Keep empty and allow client fallback/static carousel data.
  }

  return <LandingPageClient initialHeroSlides={initialHeroSlides} />;
}
