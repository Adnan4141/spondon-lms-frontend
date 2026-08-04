import type { Metadata } from 'next';

/** Canonical public origin — prefers env (VPS / local), falls back to Spondon prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://spondonedu.com'
).replace(/\/$/, '');

export const SITE_NAME = 'Spondon Academic';
/** Prefer DB `seo.organization_name`; this is the code fallback. */
export const ORGANIZATION_NAME = 'Spondon Academic & Admission Program';
export const DEFAULT_OG_IMAGE = '/images/logo/spondon-logo.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const LOGO_PATH = '/images/logo/spondon_favicon.png';
export const CONTACT_EMAIL = 'support@spondonpro.com';
export const OG_LOCALE = 'bn_BD';

/** Fallback when SiteSetting SEO keys are unavailable. */
export const DEFAULT_SITE_DESCRIPTION =
  'Spondon Academic & Admission Program — a concern of Spondon EdTech Limited — provides quality education support for 100,000+ students across Bangladesh at the secondary and higher secondary levels.';

export function absoluteSiteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function toAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return absoluteSiteUrl(url);
}

export function defaultOpenGraphImages(alt = ORGANIZATION_NAME) {
  return [
    {
      url: absoluteSiteUrl(DEFAULT_OG_IMAGE),
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
      alt,
      type: 'image/png' as const,
    },
  ];
}

export function openGraphImagesFor(imageUrl: string | undefined | null, alt: string) {
  const absolute = toAbsoluteImageUrl(imageUrl);
  if (!absolute) return defaultOpenGraphImages(alt);
  return [
    {
      url: absolute,
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
      alt,
    },
  ];
}

type BuildPublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
  imageUrl?: string | null;
  type?: 'website' | 'article' | 'profile';
  /** When true, use `title` as-is for OG/Twitter (no `| Spondon` suffix). */
  absoluteTitle?: boolean;
  siteName?: string;
  brandName?: string;
  noIndex?: boolean;
  follow?: boolean;
};

/** Full Open Graph + Twitter + canonical for public marketing pages. */
export function buildPublicPageMetadata({
  title,
  description,
  path,
  imageAlt,
  imageUrl,
  type = 'website',
  absoluteTitle = false,
  siteName = ORGANIZATION_NAME,
  brandName = SITE_NAME,
  noIndex = false,
  follow = true,
}: BuildPublicPageMetadataInput): Metadata {
  const canonical = absoluteSiteUrl(path);
  const pageTitle =
    absoluteTitle || title.includes('|') || title === siteName || title === brandName
      ? title
      : `${title} | ${brandName}`;
  const images = openGraphImagesFor(imageUrl, imageAlt || title);
  const twitterImage = images[0]?.url || absoluteSiteUrl(DEFAULT_OG_IMAGE);

  return {
    title: absoluteTitle || title === siteName || title === brandName ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      locale: OG_LOCALE,
      siteName,
      title: pageTitle,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [twitterImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow,
          googleBot: {
            index: true,
            follow,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateDescription(value: string, maxLength = 155): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
}

export function compactDescription(
  value?: string | null,
  fallback = DEFAULT_SITE_DESCRIPTION,
): string {
  return truncateDescription(stripHtml(value) || fallback);
}

export function jsonLdScript(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
