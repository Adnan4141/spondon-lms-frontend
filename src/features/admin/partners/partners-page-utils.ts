import type { PartnerAdmin } from '@/lib/api/partners';

export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.length > 48 ? `${url.slice(0, 48)}…` : url;
  }
}

export function filterPartnersByQuery(partners: PartnerAdmin[], query: string): PartnerAdmin[] {
  const q = query.trim().toLowerCase();
  if (!q) return partners;
  return partners.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || (p.type || '').toLowerCase().includes(q),
  );
}

export function computePartnerStats(partners: PartnerAdmin[]) {
  return {
    total: partners.length,
    visible: partners.filter((p) => p.isActive).length,
    hidden: partners.filter((p) => !p.isActive).length,
  };
}

export function formatCollaborationSummary(partner: PartnerAdmin): string {
  const courseCount = partner.partnerCourses?.length ?? 0;
  const bookCount = partner.partnerBooks?.length ?? 0;
  if (courseCount + bookCount === 0) return '—';
  return [
    courseCount ? `${courseCount} course` : '',
    bookCount ? `${bookCount} book` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
