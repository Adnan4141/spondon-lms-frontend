type Props = {
  title: string;
  subtitle: string;
};

export function TrustSectionHeader({ title, subtitle }: Props) {
  return (
    <div className="text-white">
      <h2 className="mb-4 text-2xl font-bold leading-tight sm:mb-5 sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed opacity-90 sm:text-base md:text-lg">{subtitle}</p>
    </div>
  );
}
