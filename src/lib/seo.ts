export const SITE_URL = 'https://mathlabsbd.com';
export const SITE_NAME = 'Mathlab';
export const ORGANIZATION_NAME = 'Mathlab Academic & Admission Program';

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
  fallback = 'Quality education support from Mathlab.',
): string {
  return truncateDescription(stripHtml(value) || fallback);
}

export function jsonLdScript(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
