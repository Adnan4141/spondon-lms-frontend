import type { PublicCatalogBook } from './books';
import type { Partner } from './partners';
import type { PublicTeacher } from './teachers';
import type { HeroSlide, ProgramCard, SiteSetting } from './site-content';
import type { Testimonial } from '@/components/landing/types';
import type { Course, Program } from '@/types/course';
import { serverApiGet } from './server-fetch';

interface ApiListResponse<T> {
  success?: boolean;
  data?: T;
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote:
      'লাইভ ক্লাসে অ্যাডভান্সড প্রবলেম সলভিংও করায়, এতে এডমিশন টেস্টের প্রশ্ন কলেজ লাইফেই শিখে যাচ্ছি',
    name: 'ইশরাত',
    info: "বান্দরবান থেকে স্বপ্ন পূরণের লক্ষ্যে HSC '26 একাডেমিক প্রোগ্রামে",
    rating: 5,
  },
];

export interface LandingPageData {
  heroSlides: HeroSlide[];
  programCards: ProgramCard[];
  siteSettings: Record<string, string>;
  courses: Course[];
  programs: Program[];
  ebooks: PublicCatalogBook[];
  testimonials: Testimonial[];
  partners: Partner[];
  teachers: PublicTeacher[];
}

function settingsArrayToMap(settings: SiteSetting[] | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!settings) return map;
  for (const s of settings) map[s.key] = s.value;
  return map;
}

function mapTestimonials(
  rows: {
    id: string;
    quote: string;
    name: string;
    info?: string | null;
    institute?: string | null;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
    mediaCaptionTitle?: string | null;
    mediaCaptionSubtitle?: string | null;
    rating?: number | null;
  }[],
): Testimonial[] {
  return rows.map((t) => ({
    id: t.id,
    quote: t.quote,
    name: t.name,
    info: t.info || '',
    instituteName: t.institute || '',
    thumbnailUrl: t.thumbnailUrl || undefined,
    videoUrl: t.videoUrl || undefined,
    mediaCaptionTitle: t.mediaCaptionTitle || undefined,
    mediaCaptionSubtitle: t.mediaCaptionSubtitle || undefined,
    rating: t.rating ?? 5,
  }));
}

export async function getLandingPageData(): Promise<LandingPageData> {
  const [
    heroRes,
    programCardRes,
    settingsRes,
    courseRes,
    programRes,
    ebookRes,
    testimonialRes,
    partnerRes,
    teacherRes,
  ] = await Promise.all([
    serverApiGet<ApiListResponse<HeroSlide[]>>('/site-content/hero-slides'),
    serverApiGet<ApiListResponse<ProgramCard[]>>('/site-content/program-cards'),
    serverApiGet<ApiListResponse<SiteSetting[]>>('/site-content/settings'),
    serverApiGet<ApiListResponse<Course[]>>(
      '/courses?limit=6&websiteVisible=true&featured=true&status=ACTIVE',
    ),
    serverApiGet<ApiListResponse<Program[]>>('/programs'),
    serverApiGet<ApiListResponse<PublicCatalogBook[]>>('/books/public-list?featured=true&limit=6'),
    serverApiGet<ApiListResponse<Parameters<typeof mapTestimonials>[0]>>('/testimonials/public?type=HOME'),
    serverApiGet<ApiListResponse<Partner[]>>('/partners/public'),
    serverApiGet<ApiListResponse<PublicTeacher[]>>('/users/teachers/public'),
  ]);

  const apiTestimonials =
    testimonialRes?.success && testimonialRes.data?.length
      ? mapTestimonials(testimonialRes.data)
      : [];

  return {
    heroSlides: heroRes?.success && heroRes.data?.length ? heroRes.data : [],
    programCards: programCardRes?.success && programCardRes.data ? programCardRes.data : [],
    siteSettings: settingsArrayToMap(settingsRes?.success ? settingsRes.data : []),
    courses: courseRes?.success && courseRes.data ? courseRes.data : [],
    programs: programRes?.success && programRes.data ? programRes.data : [],
    ebooks: ebookRes?.success && ebookRes.data ? ebookRes.data : [],
    testimonials: apiTestimonials.length > 0 ? apiTestimonials : FALLBACK_TESTIMONIALS,
    partners: partnerRes?.success && partnerRes.data ? partnerRes.data : [],
    teachers: teacherRes?.success && teacherRes.data ? teacherRes.data : [],
  };
}
