import DOMPurify from 'dompurify';

/** Client-only sanitization before dangerouslySetInnerHTML (defense in depth after backend sanitize-html). */
export function sanitizePrivacyDisplayHtml(html: string): string {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  });
}
