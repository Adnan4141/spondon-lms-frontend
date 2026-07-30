import { API_ORIGIN } from './api';

const COURSE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%235C2D91'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='28' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E";

/** Hostnames allowed in next.config.ts `images.remotePatterns`. Keep in sync. */
const NEXT_IMAGE_HOSTS = new Set([
  (() => {
    try {
      return new URL(API_ORIGIN).hostname;
    } catch {
      return 'localhost';
    }
  })(),
  'localhost',
  'mathlabsbd.com',
  'api.mathlabsbd.com',
  'spondonedu.com',
  'api.spondonedu.com',
  'placehold.co',
]);

/** Resolve CMS/upload paths for Next.js Image (same-origin /uploads via rewrite). */
export function resolveMediaImageUrl(url: string | undefined | null, fallback?: string): string {
  if (!url) return fallback || COURSE_PLACEHOLDER;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/images/') || url.startsWith('/uploads/')) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
}

/** Whether `src` can be rendered with next/image (configured remote or same-origin path). */
export function isNextImageHost(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('/images/') || src.startsWith('/uploads/') || src.startsWith('data:')) return true;

  try {
    const { hostname } = new URL(
      src.startsWith('http://') || src.startsWith('https://')
        ? src
        : `${API_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`,
    );
    return NEXT_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export { COURSE_PLACEHOLDER };
