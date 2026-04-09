/**
 * Privacy-oriented YouTube embed URLs (nocookie host + limited branding/related).
 * Note: the video id remains visible in the iframe src; true secrecy needs self-hosted video.
 */
const EMBED_QUERY = 'modestbranding=1&rel=0&iv_load_policy=3';

function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const embedMatch = trimmed.match(
    /(?:youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (embedMatch?.[1]) return embedMatch[1];

  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
      const liveIdx = parts.indexOf('live');
      if (liveIdx !== -1 && parts[liveIdx + 1]) return parts[liveIdx + 1];
    }
    if (u.hostname === 'youtu.be') {
      const seg = u.pathname.replace(/^\//, '').split('/')[0];
      if (seg) return seg;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** Returns youtube-nocookie embed URL with privacy-oriented params, or null if not YouTube. */
export function getYoutubePrivacyEmbedUrl(urlOrEmbed: string): string | null {
  const id = extractYoutubeVideoId(urlOrEmbed);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?${EMBED_QUERY}`;
}
