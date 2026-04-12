/** Returns YouTube embed URL or null if not a recognized YouTube link. */
export function getYoutubeEmbedSrc(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function isLikelyDirectVideoUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u.startsWith('http')) return false;
  if (getYoutubeEmbedSrc(url)) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(u) || u.includes('/uploads/');
}
