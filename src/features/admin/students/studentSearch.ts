export const STUDENT_SEARCH_MIN_LENGTH = 3;

export function isExactStudentLookup(query: string): boolean {
  const trimmed = query.trim();
  const mobileNorm = trimmed.replace(/\s/g, '');
  return (
    /^\d{7}$/.test(trimmed) ||
    /^01[3-9]\d{8}$/.test(mobileNorm) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  );
}

/** Search sent to the API — skips overly broad queries unless exact reg/mobile/email. */
export function effectiveStudentSearch(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return '';
  if (isExactStudentLookup(trimmed)) return trimmed;
  if (trimmed.length < STUDENT_SEARCH_MIN_LENGTH) return '';
  return trimmed;
}

export function studentSearchHint(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed || isExactStudentLookup(trimmed) || trimmed.length >= STUDENT_SEARCH_MIN_LENGTH) {
    return null;
  }
  return `Type at least ${STUDENT_SEARCH_MIN_LENGTH} characters (or full mobile / reg no)`;
}
