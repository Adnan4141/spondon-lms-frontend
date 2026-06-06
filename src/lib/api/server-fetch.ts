/** Server-only fetch helper with ISR (matches backend Redis TTL of 300s). */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const SERVER_REVALIDATE_SECONDS = 300;

export async function serverApiGet<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
