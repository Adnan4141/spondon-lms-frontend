/**
 * Stable URL slugs for course subjects (from CourseContent.subjectTitle).
 * ASCII titles get readable slugs; Bangla/Unicode fall back to a short base64url-style id.
 */

export function slugifyCourseSubject(title: string): string {
  const raw = (title || '').trim() || 'Course';
  const ascii = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  if (ascii.length >= 3) return ascii.slice(0, 64);

  const bytes = new TextEncoder().encode(raw);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      : '';
  return `u${(b64 || 'course').slice(0, 48)}`;
}

export type SubjectRouteEntry = { title: string; slug: string };

/** Deterministic order + unique slugs for all subject labels in a course. */
export function buildSubjectRouteTable(subjectTitles: string[]): SubjectRouteEntry[] {
  const unique = [
    ...new Set(subjectTitles.map((t) => ((t || '').trim() || 'Course') as string)),
  ].sort((a, b) => a.localeCompare(b));

  const used = new Set<string>();
  const out: SubjectRouteEntry[] = [];

  for (const title of unique) {
    let base = slugifyCourseSubject(title);
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
      slug = `${base}-${n++}`;
    }
    used.add(slug);
    out.push({ title, slug });
  }

  return out;
}

export function resolveSubjectTitleFromSlug(
  slug: string,
  table: SubjectRouteEntry[],
): string | null {
  const row = table.find((x) => x.slug === slug);
  return row ? row.title : null;
}

export function normalizeSubjectLabel(raw: string | null | undefined): string {
  return (raw || '').trim() || 'Course';
}
