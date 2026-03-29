/** Extract YouTube video id from common URL shapes (watch, youtu.be, embed, shorts). */
export function parseYoutubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const u = raw.startsWith('http') ? new URL(raw) : new URL(`https://${raw}`);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;

      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1] && /^[\w-]{11}$/.test(parts[embedIdx + 1])) {
        return parts[embedIdx + 1];
      }
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx >= 0 && parts[shortsIdx + 1] && /^[\w-]{11}$/.test(parts[shortsIdx + 1])) {
        return parts[shortsIdx + 1];
      }
    }
  } catch {
    // plain video id
    if (/^[\w-]{11}$/.test(raw)) return raw;
    return null;
  }

  if (/^[\w-]{11}$/.test(raw)) return raw;
  return null;
}

export function isYoutubeContentUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  if (/^https?:\/\//i.test(url)) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com' || host === 'music.youtube.com';
    } catch {
      return false;
    }
  }
  return parseYoutubeVideoId(url) !== null;
}

export function toYoutubeEmbedSrc(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}
