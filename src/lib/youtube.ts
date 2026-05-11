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
      return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com';
    } catch {
      return false;
    }
  }
  return parseYoutubeVideoId(url) !== null;
}

export function toYoutubeEmbedSrc(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function normalizeYoutubeWatchUrl(input: string): string | null {
  const videoId = parseYoutubeVideoId(input);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

/**
 * Build a privacy-enhanced, distraction-reduced YouTube embed URL.
 *
 * Uses youtube-nocookie.com to avoid setting third-party cookies before consent.
 * Parameters used:
 *   rel=0            — suppress related videos from other channels
 *   controls=1       — keep native player controls (removing them breaks accessibility)
 *   iv_load_policy=3 — hide video annotations
 *   playsinline=1    — prevent iOS full-screen auto-takeover
 *   disablekb=1      — disable keyboard shortcuts (reduces distraction, not DRM)
 *   fs=0             — hide YouTube fullscreen button so page watermark stays visible
 *   modestbranding=1 — partial YouTube logo reduction (deprecated, still partially effective)
 *   autoplay         — controlled by caller param (default 0, set 1 after user gesture)
 *
 * Security note: The video ID remains visible in the iframe src. Unlisted YouTube
 * videos are NOT made private by this URL. For real access control use signed streaming
 * URLs (Bunny Stream, Mux, Cloudflare Stream, or AWS S3 + HLS).
 */
export function toYoutubeNoCookieSrc(videoId: string, autoplay = false): string {
  // origin tells YouTube to only accept/send postMessage API commands from our domain.
  // Required for enablejsapi events (onEnded, pause-on-tab-hide) to work securely.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    rel: '0',
    controls: '1',
    iv_load_policy: '3',
    playsinline: '1',
    disablekb: '1',
    fs: '0',
    modestbranding: '1',
    autoplay: autoplay ? '1' : '0',
    enablejsapi: '1',
    ...(origin ? { origin } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
