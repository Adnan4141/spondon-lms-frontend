type Props = {
  embedSrc: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  showOverlay: boolean;
};

export function TrustTestimonialMediaEmbed({ embedSrc, overlayTitle, overlaySubtitle, showOverlay }: Props) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-200/60">
      <iframe
        title="Testimonial video"
        src={`${embedSrc}?rel=0`}
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
