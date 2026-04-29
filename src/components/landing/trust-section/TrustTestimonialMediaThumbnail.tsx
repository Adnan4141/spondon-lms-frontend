'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import type { Testimonial } from '../types';
import { resolveTrustMediaUrl } from './media-url';

type Props = {
  testimonial: Testimonial;
  thumbSrc: string;
  videoSrc: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  showOverlay: boolean;
};

export function TrustTestimonialMediaThumbnail({
  testimonial,
  thumbSrc,
  videoSrc,
  overlayTitle,
  overlaySubtitle,
  showOverlay,
}: Props) {
  const href = videoSrc.startsWith('http') ? videoSrc : resolveTrustMediaUrl(videoSrc) || '#';

  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-inner ring-1 ring-slate-200/60">
      <Image
        src={thumbSrc}
        alt={testimonial.name || 'Testimonial'}
        fill
    
        className="object-cover h-72 transition-transform duration-500 group-hover:scale-[1.02]"
      />
      {videoSrc ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3b4a97] text-white shadow-xl ring-4 ring-white/30">
            <Play className="ml-0.5" fill="currentColor" size={24} />
          </span>
        </a>
      ) : null}
      {showOverlay ? (
        <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-linear-to-t from-black/80 to-transparent p-4">
          {overlayTitle ? <p className="text-sm font-bold text-white">{overlayTitle}</p> : null}
          {overlaySubtitle ? <p className="text-xs text-white/80">{overlaySubtitle}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
