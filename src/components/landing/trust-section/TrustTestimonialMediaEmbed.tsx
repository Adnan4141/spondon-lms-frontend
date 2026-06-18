'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

type Props = {
  embedSrc: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  showOverlay: boolean;
};

function extractYoutubeId(embedSrc: string): string | null {
  const match = embedSrc.match(/\/embed\/([^/?]+)/);
  return match?.[1] ?? null;
}

export function TrustTestimonialMediaEmbed({
  embedSrc,
  overlayTitle,
  overlaySubtitle,
  showOverlay,
}: Props) {
  const [active, setActive] = useState(false);
  const videoId = extractYoutubeId(embedSrc);
  const thumbSrc = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 text-left shadow-inner ring-1 ring-slate-200/60"
        aria-label="Play testimonial video"
      >
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbSrc} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : null}
        <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3b4a97] text-white shadow-xl ring-4 ring-white/30 transition-transform group-hover:scale-105">
            <Play className="ml-0.5" fill="currentColor" size={24} />
          </span>
        </span>
        {showOverlay ? (
          <span className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/85 via-black/40 to-transparent p-4">
            {overlayTitle ? <p className="text-sm font-bold text-white">{overlayTitle}</p> : null}
            {overlaySubtitle ? <p className="text-xs text-white/85">{overlaySubtitle}</p> : null}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-200/60">
      <iframe
        title="Testimonial video"
        src={`${embedSrc}?rel=0&autoplay=1`}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {showOverlay ? (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/85 via-black/40 to-transparent p-4">
          {overlayTitle ? <p className="text-sm font-bold text-white">{overlayTitle}</p> : null}
          {overlaySubtitle ? <p className="text-xs text-white/85">{overlaySubtitle}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
