import { API_ORIGIN } from '@/lib/api';

export function resolveProgramThumbnail(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
}
