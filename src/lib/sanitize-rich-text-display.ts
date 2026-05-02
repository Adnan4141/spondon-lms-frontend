import DOMPurify from 'dompurify';

export function sanitizeRichTextDisplayHtml(html: string): string {
  if (typeof window === 'undefined') return html;

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  });
}