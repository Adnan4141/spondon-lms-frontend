import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

export function resolveTrustMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const t = url.trim();
  if (t.startsWith('http')) return t;
  return resolveAttachmentUrl(t, API_ORIGIN);
}
