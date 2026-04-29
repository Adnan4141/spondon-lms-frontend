type Props = {
  resolvedVideo: string;
  poster?: string;
};

export function TrustTestimonialMediaDirect({ resolvedVideo, poster }: Props) {
  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-200/60">
      <video className="h-full w-full object-cover" controls playsInline poster={poster} preload="metadata">
        <source src={resolvedVideo} />
      </video>
    </div>
  );
}
