'use client';

import type { Testimonial } from '../types';
import { getYoutubeEmbedSrc, isLikelyDirectVideoUrl } from '@/lib/media-embed';
import { resolveTrustMediaUrl } from './media-url';
import { TrustTestimonialMediaEmbed } from './TrustTestimonialMediaEmbed';
import { TrustTestimonialMediaDirect } from './TrustTestimonialMediaDirect';
import { TrustTestimonialMediaThumbnail } from './TrustTestimonialMediaThumbnail';
import { TrustTestimonialMediaEmpty } from './TrustTestimonialMediaEmpty';

type Props = {
  testimonial: Testimonial;
};

export function TrustTestimonialMedia({ testimonial: t }: Props) {
  const videoSrc = t.videoUrl?.trim() || '';
  const thumbSrc = resolveTrustMediaUrl(t.thumbnailUrl);
  const embed = videoSrc ? getYoutubeEmbedSrc(videoSrc) : null;
  const directVideo = Boolean(videoSrc && !embed && isLikelyDirectVideoUrl(videoSrc));
  const resolvedVideo = videoSrc ? resolveTrustMediaUrl(videoSrc) || videoSrc : '';

  const overlayTitle = t.mediaCaptionTitle?.trim();
  const overlaySubtitle = t.mediaCaptionSubtitle?.trim();
  const showOverlay = Boolean(overlayTitle || overlaySubtitle);

  if (embed) {
    return (
      <TrustTestimonialMediaEmbed
        embedSrc={embed}
        overlayTitle={overlayTitle}
        overlaySubtitle={overlaySubtitle}
        showOverlay={showOverlay}
      />
    );
  }

  if (directVideo && resolvedVideo) {
    return <TrustTestimonialMediaDirect resolvedVideo={resolvedVideo} poster={thumbSrc} />;
  }

  if (thumbSrc) {
    return (
      <TrustTestimonialMediaThumbnail
        testimonial={t}
        thumbSrc={thumbSrc}
        videoSrc={videoSrc}
        overlayTitle={overlayTitle}
        overlaySubtitle={overlaySubtitle}
        showOverlay={showOverlay}
      />
    );
  }

  return <TrustTestimonialMediaEmpty name={t.name} />;
}
