/** Server-only fetch helper with ISR (matches backend Redis TTL of 300s). */
import { getServerApiBaseUrl } from '../api-config';

export const SERVER_REVALIDATE_SECONDS = 300;

export async function serverApiGet<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${getServerApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      next: { revalidate: SERVER_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
