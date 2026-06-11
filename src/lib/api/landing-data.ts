import { cache } from 'react';
import type { PublicCatalogBook } from './books';
import type { Partner } from './partners';
import type { PublicTeacher } from './teachers';
import type { HeroSlide, ProgramCard, SiteSetting, TrustFeature } from './site-content';
import type { Testimonial } from '@/components/landing/types';
import type { Course, Program } from '@/types/course';
import { serverApiGet } from './server-fetch';

interface ApiListResponse<T> {
  success?: boolean;
  data?: T;
}

interface LandingCriticalApiPayload {
  heroSlides: HeroSlide[];
  programCards: ProgramCard[];
  siteSettings: SiteSetting[];
  programs: Program[];
}

interface LandingDeferredApiPayload {
  courses: Course[];
  ebooks: PublicCatalogBook[];
  testimonials: Parameters<typeof mapTestimonials>[0];
  partners: Partner[];
  teachers: PublicTeacher[];
  trustFeatures: TrustFeature[];
}

const FALLBACK_TRUST_FEATURES = [
  { id: 'content', title: 'সেরা কনটেন্ট ', icon: '💎' },
  { id: 'material', title: 'সহজ স্টাডি ম্যাটেরিয়াল', icon: '🎬' },
  { id: 'value', title: 'স্বল্প খরচে অনেক কিছু', icon: '📦' },
  { id: 'presentation', title: 'সাবলীল উপস্থাপনা', icon: '📚' },
] as TrustFeature[];

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

export interface LandingCriticalData {
  heroSlides: HeroSlide[];
  programCards: ProgramCard[];
  siteSettings: Record<string, string>;
  programs: Program[];
}

export interface LandingDeferredData {
  courses: Course[];
  ebooks: PublicCatalogBook[];
  testimonials: Testimonial[];
  partners: Partner[];
  teachers: PublicTeacher[];
  trustFeatures: TrustFeature[];
}

export interface LandingPageData extends LandingCriticalData, LandingDeferredData {}

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

function normalizeCriticalPayload(payload: LandingCriticalApiPayload): LandingCriticalData {
  return {
    heroSlides: payload.heroSlides?.length ? payload.heroSlides : [],
    programCards: payload.programCards ?? [],
    siteSettings: settingsArrayToMap(payload.siteSettings),
    programs: payload.programs ?? [],
  };
}

function normalizeDeferredPayload(payload: LandingDeferredApiPayload): LandingDeferredData {
  const apiTestimonials =
    payload.testimonials?.length > 0 ? mapTestimonials(payload.testimonials) : [];
  const apiTrustFeatures = payload.trustFeatures?.length > 0 ? payload.trustFeatures : [];

  return {
    courses: payload.courses ?? [],
    ebooks: payload.ebooks ?? [],
    testimonials: apiTestimonials.length > 0 ? apiTestimonials : FALLBACK_TESTIMONIALS,
    partners: payload.partners ?? [],
    teachers: payload.teachers ?? [],
    trustFeatures:
      apiTrustFeatures.length > 0 ? apiTrustFeatures.slice(0, 4) : FALLBACK_TRUST_FEATURES,
  };
}

async function fetchLandingCriticalLegacy(): Promise<LandingCriticalData> {
  const [heroRes, programCardRes, settingsRes, programRes] = await Promise.all([
    serverApiGet<ApiListResponse<HeroSlide[]>>('/site-content/hero-slides'),
    serverApiGet<ApiListResponse<ProgramCard[]>>('/site-content/program-cards'),
    serverApiGet<ApiListResponse<SiteSetting[]>>('/site-content/settings'),
    serverApiGet<ApiListResponse<Program[]>>('/programs'),
  ]);

  return normalizeCriticalPayload({
    heroSlides: heroRes?.success && heroRes.data?.length ? heroRes.data : [],
    programCards: programCardRes?.success && programCardRes.data ? programCardRes.data : [],
    siteSettings: settingsRes?.success ? settingsRes.data ?? [] : [],
    programs: programRes?.success && programRes.data ? programRes.data : [],
  });
}

async function fetchLandingDeferredLegacy(): Promise<LandingDeferredData> {
  const [courseRes, ebookRes, testimonialRes, partnerRes, teacherRes, trustFeatureRes] =
    await Promise.all([
      serverApiGet<ApiListResponse<Course[]>>(
        '/courses?limit=6&websiteVisible=true&featured=true&status=ACTIVE',
      ),
      serverApiGet<ApiListResponse<PublicCatalogBook[]>>('/books/public-list?featured=true&limit=6'),
      serverApiGet<ApiListResponse<Parameters<typeof mapTestimonials>[0]>>(
        '/testimonials/public?type=HOME',
      ),
      serverApiGet<ApiListResponse<Partner[]>>('/partners/public'),
      serverApiGet<ApiListResponse<PublicTeacher[]>>('/users/teachers/public?limit=16'),
      serverApiGet<ApiListResponse<TrustFeature[]>>('/site-content/trust-features'),
    ]);

  return normalizeDeferredPayload({
    courses: courseRes?.success && courseRes.data ? courseRes.data : [],
    ebooks: ebookRes?.success && ebookRes.data ? ebookRes.data : [],
    testimonials:
      testimonialRes?.success && testimonialRes.data?.length ? testimonialRes.data : [],
    partners: partnerRes?.success && partnerRes.data ? partnerRes.data : [],
    teachers: teacherRes?.success && teacherRes.data ? teacherRes.data : [],
    trustFeatures: trustFeatureRes?.success && trustFeatureRes.data ? trustFeatureRes.data : [],
  });
}

/** Above-the-fold only — does not wait for courses/teachers/etc. */
export const getLandingCriticalData = cache(async (): Promise<LandingCriticalData> => {
  const res = await serverApiGet<ApiListResponse<LandingCriticalApiPayload>>('/landing/critical');
  if (res?.success && res.data) {
    return normalizeCriticalPayload(res.data);
  }
  return fetchLandingCriticalLegacy();
});

/** Below-the-fold — loaded inside Suspense boundaries. */
export const getLandingDeferredData = cache(async (): Promise<LandingDeferredData> => {
  const res = await serverApiGet<ApiListResponse<LandingDeferredApiPayload>>('/landing/deferred');
  if (res?.success && res.data) {
    return normalizeDeferredPayload(res.data);
  }

  const full = await serverApiGet<
    ApiListResponse<LandingCriticalApiPayload & LandingDeferredApiPayload>
  >('/landing');
  if (full?.success && full.data) {
    return normalizeDeferredPayload(full.data);
  }

  return fetchLandingDeferredLegacy();
});

export const getLandingPageData = cache(async (): Promise<LandingPageData> => {
  const [critical, deferred] = await Promise.all([
    getLandingCriticalData(),
    getLandingDeferredData(),
  ]);
  return { ...critical, ...deferred };
});

async function getSiteSettings() {
  const { siteSettings } = await getLandingCriticalData();
  return siteSettings;
}

export async function getLandingCoursesData() {
  const [deferred, siteSettings] = await Promise.all([
    getLandingDeferredData(),
    getSiteSettings(),
  ]);
  return { courses: deferred.courses, siteSettings };
}

export async function getLandingTrustData() {
  const [deferred, siteSettings] = await Promise.all([
    getLandingDeferredData(),
    getSiteSettings(),
  ]);
  return {
    testimonials: deferred.testimonials,
    trustFeatures: deferred.trustFeatures,
    siteSettings,
  };
}

export async function getLandingTeachersData() {
  const [deferred, siteSettings] = await Promise.all([
    getLandingDeferredData(),
    getSiteSettings(),
  ]);
  return { teachers: deferred.teachers, siteSettings };
}

export async function getLandingLibraryData() {
  const [deferred, siteSettings] = await Promise.all([
    getLandingDeferredData(),
    getSiteSettings(),
  ]);
  return { ebooks: deferred.ebooks, siteSettings };
}

export async function getLandingPartnersData() {
  const [deferred, siteSettings] = await Promise.all([
    getLandingDeferredData(),
    getSiteSettings(),
  ]);
  return { partners: deferred.partners, siteSettings };
}

export async function getLandingFooterData() {
  return { siteSettings: await getSiteSettings() };
}
