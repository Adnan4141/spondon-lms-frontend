type Props = {
  name?: string;
};

export function TrustTestimonialMediaEmpty({ name }: Props) {
  const initial = name?.trim().charAt(0).toUpperCase() || 'S';

  return (
    <div className="flex aspect-video items-center justify-center rounded-2xl bg-linear-to-br from-indigo-50 via-white to-violet-50 ring-1 ring-slate-200/60">
      <span className="text-6xl font-black text-indigo-200 select-none sm:text-7xl">{initial}</span>
    </div>
  );
}
