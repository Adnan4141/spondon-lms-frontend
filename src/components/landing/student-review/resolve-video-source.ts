export type ResolvedVideoSource = { kind: 'iframe' | 'video'; src: string } | null;

/** Maps YouTube / Vimeo / direct URLs to embed or native video sources for the testimonial modal. */
export function resolveVideoSource(url?: string): ResolvedVideoSource {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return { kind: 'iframe', src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` };
    }

    if (host.includes('youtu.be')) {
      const videoId = parsed.pathname.replace(/^\//, '');
      if (videoId) return { kind: 'iframe', src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` };
    }

    if (host.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop();
      if (videoId) return { kind: 'iframe', src: `https://player.vimeo.com/video/${videoId}?autoplay=1` };
    }

    return { kind: 'video', src: url };
  } catch {
    return { kind: 'video', src: url };
  }
}
