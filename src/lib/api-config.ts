const DEFAULT_SERVER_API = 'http://localhost:5000/api';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function isLocalApiUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Node/server-side API base (talks to backend on the same machine). */
export function getServerApiBaseUrl(): string {
  return trimTrailingSlash(
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_SERVER_API,
  );
}

/**
 * Browser API base. Uses the Next.js `/api` proxy for local dev so phones on the
 * same LAN hit the dev machine's backend instead of their own localhost.
 */
export function getBrowserApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (
    process.env.NEXT_PUBLIC_USE_API_PROXY === 'true' ||
    !configured ||
    isLocalApiUrl(configured)
  ) {
    return '/api';
  }
  return trimTrailingSlash(configured);
}

/** Resolves API base for the current runtime (server vs browser). */
export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') return getServerApiBaseUrl();
  return getBrowserApiBaseUrl();
}

/** Origin used to prefix upload paths during SSR; browser uses relative `/uploads`. */
export function resolveApiOrigin(): string {
  const base = resolveApiBaseUrl();
  if (base.startsWith('/')) {
    if (typeof window !== 'undefined') return window.location.origin;
    return trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  }
  return base.replace(/\/api$/, '');
}
