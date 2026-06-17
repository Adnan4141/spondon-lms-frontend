import type { Testimonial } from '../types';

type Props = {
  testimonial: Testimonial;
};

export function TrustTestimonialQuoteColumn({ testimonial }: Props) {
  return (
    <div className="md:col-span-7">
      <div className="mb-3 flex gap-1 sm:mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/10 pt-1.5 font-serif text-3xl text-blue-600 sm:h-8 sm:w-8 sm:pt-2 sm:text-4xl">
          “
        </div>
      </div>
      <blockquote className="mb-4 line-clamp-6 text-base font-medium italic leading-relaxed text-slate-600 sm:mb-5 sm:line-clamp-8 sm:text-lg md:line-clamp-10">
        &quot;{testimonial.quote}&quot;
      </blockquote>
      <div>
        <h4 className="text-lg font-bold text-[#2d3a7d] sm:text-xl md:text-2xl">{testimonial.name}</h4>
        <p className="text-xs font-medium text-slate-400 sm:text-sm">{testimonial.info}</p>
      </div>
    </div>
  );
}
