import type { Metadata } from 'next';
import { loadPublicSiteSettings } from '@/lib/load-site-settings';
import {
  absoluteSiteUrl,
  buildPublicPageMetadata,
  compactDescription,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_DESCRIPTION,
  LOGO_PATH,
  OG_LOCALE,
  ORGANIZATION_NAME,
  SITE_NAME,
  SITE_URL,
  stripHtml,
  truncateDescription,
} from '@/lib/seo';

export const FALLBACK_SITE_TITLE = 'Spondon Academic & Admission Program';
export const FALLBACK_ORGANIZATION_NAME = ORGANIZATION_NAME;
export const FALLBACK_SITE_DESCRIPTION = DEFAULT_SITE_DESCRIPTION;

export type SeoBrand = {
  siteTitle: string;
  organizationName: string;
  brandName: string;
  description: string;
  shortDescription: string;
  missionQuote: string;
  aboutHeroDescription: string;
  settings: Record<string, string>;
};

function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const cleaned = stripHtml(value || '').trim();
    if (cleaned) return cleaned;
  }
  return '';
}

/** Resolve SEO title/description from SiteSetting (DB), with Spondon fallbacks. */
export async function loadSeoBrand(): Promise<SeoBrand> {
  const settings = await loadPublicSiteSettings();

  const brandName =
    firstNonEmpty(settings['navbar.brand_name'], settings['footer.brand_name'], settings['seo.organization_name']) ||
    SITE_NAME;

  const organizationName =
    firstNonEmpty(settings['seo.organization_name'], settings['footer.brand_name'], settings['navbar.brand_name']) ||
    FALLBACK_ORGANIZATION_NAME;

  const missionQuote = firstNonEmpty(
    settings['about.mission_quote'],
    'Quality education for every student.',
  );

  const siteTitle =
    firstNonEmpty(settings['seo.site_title']) ||
    (brandName && missionQuote ? `${brandName} | ${missionQuote}` : FALLBACK_SITE_TITLE);

  const description =
    firstNonEmpty(
      settings['seo.site_description'],
      settings['footer.description'],
      settings['about.story_body'],
      settings['about.hero_description'],
    ) || FALLBACK_SITE_DESCRIPTION;

  const aboutHeroDescription =
    firstNonEmpty(settings['about.hero_description'], description) || description;

  return {
    siteTitle,
    organizationName,
    brandName,
    description,
    shortDescription: truncateDescription(description, 155),
    missionQuote,
    aboutHeroDescription: truncateDescription(aboutHeroDescription, 160),
    settings,
  };
}

export async function buildRootMetadata(): Promise<Metadata> {
  const brand = await loadSeoBrand();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: brand.siteTitle,
      template: `%s | ${brand.brandName || SITE_NAME}`,
    },
    description: brand.shortDescription,
    applicationName: brand.brandName || SITE_NAME,
    referrer: 'origin-when-cross-origin',
    category: 'education',
    keywords: [
      brand.brandName,
      'Spondon Academic',
      'Spondon EdTech',
      'SSC preparation Bangladesh',
      'HSC preparation Bangladesh',
      'online education Bangladesh',
      'admission program Bangladesh',
      'secondary education Bangladesh',
    ].filter(Boolean),
    authors: [{ name: brand.organizationName || ORGANIZATION_NAME, url: SITE_URL }],
    creator: brand.organizationName || ORGANIZATION_NAME,
    publisher: brand.organizationName || ORGANIZATION_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE,
      url: SITE_URL,
      siteName: brand.organizationName,
      title: brand.siteTitle,
      description: brand.shortDescription,
      images: [
        {
          url: absoluteSiteUrl(DEFAULT_OG_IMAGE),
          width: 1200,
          height: 630,
          alt: brand.siteTitle,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: brand.siteTitle,
      description: brand.shortDescription,
      images: [absoluteSiteUrl(DEFAULT_OG_IMAGE)],
    },
    icons: {
      icon: [{ url: LOGO_PATH, type: 'image/png' }],
      apple: [{ url: LOGO_PATH, type: 'image/png' }],
      shortcut: LOGO_PATH,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export async function buildHomeMetadata(): Promise<Metadata> {
  const brand = await loadSeoBrand();
  return buildPublicPageMetadata({
    title: brand.siteTitle,
    description: brand.shortDescription,
    path: '/',
    imageAlt: brand.organizationName,
    absoluteTitle: true,
  });
}

export async function buildAboutMetadata(): Promise<Metadata> {
  const brand = await loadSeoBrand();
  const story = firstNonEmpty(brand.settings['about.story_body'], brand.aboutHeroDescription, brand.description);
  return buildPublicPageMetadata({
    title: 'আমাদের সম্পর্কে',
    description: compactDescription(story, brand.shortDescription),
    path: '/about-us',
    imageAlt: `About ${brand.brandName}`,
  });
}

export function buildOrganizationJsonLd(brand: SeoBrand) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: brand.organizationName,
    alternateName: [brand.brandName, 'Spondon EdTech Limited', 'Spondon Academic'].filter(
      (name, index, all) => name && all.indexOf(name) === index,
    ),
    url: SITE_URL,
    logo: absoluteSiteUrl(LOGO_PATH),
    image: absoluteSiteUrl(DEFAULT_OG_IMAGE),
    description: brand.shortDescription,
    slogan: brand.missionQuote || undefined,
    foundingDate: '2019',
    areaServed: {
      '@type': 'Country',
      name: 'Bangladesh',
    },
    email: brand.settings['footer.email'] || undefined,
    contactPoint: brand.settings['footer.email']
      ? {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: brand.settings['footer.email'],
          telephone: brand.settings['footer.phone'] || undefined,
          areaServed: 'BD',
          availableLanguage: ['bn', 'en'],
        }
      : undefined,
  };
}

export function buildWebsiteJsonLd(brand: SeoBrand) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.siteTitle,
    alternateName: brand.brandName,
    url: SITE_URL,
    inLanguage: 'bn-BD',
    description: brand.shortDescription,
    publisher: {
      '@type': 'EducationalOrganization',
      name: brand.organizationName,
      url: SITE_URL,
      logo: absoluteSiteUrl(LOGO_PATH),
    },
  };
}
