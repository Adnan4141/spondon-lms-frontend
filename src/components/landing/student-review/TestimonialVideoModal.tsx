'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ResolvedVideoSource } from './resolve-video-source';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeVideo: ResolvedVideoSource;
  speakerName?: string;
};

export function TestimonialVideoModal({ open, onOpenChange, activeVideo, speakerName }: Props) {
  const titleBase = speakerName ? `${speakerName} video testimonial` : 'Video testimonial';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-none bg-slate-950 p-0 shadow-[0_32px_64px_-18px_rgba(15,23,42,0.65)] sm:max-w-4xl">
        <DialogTitle className="sr-only">{titleBase}</DialogTitle>
        <div className="aspect-video w-full bg-black">
          {activeVideo?.kind === 'iframe' ? (
            <iframe
              src={activeVideo.src}
              title={titleBase}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : activeVideo?.kind === 'video' ? (
            <video src={activeVideo.src} className="h-full w-full" controls autoPlay playsInline />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
