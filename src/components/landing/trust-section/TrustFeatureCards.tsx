import type { TrustFeature } from '@/lib/api/site-content';

type Props = {
  features: TrustFeature[];
};

export function TrustFeatureCards({ features }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {features.map((feature) => (
        <div
          key={feature.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-transform hover:scale-[1.02] sm:gap-4 sm:rounded-2xl sm:p-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-2xl sm:h-14 sm:w-14 sm:rounded-xl sm:text-3xl">
            <span>{feature.icon}</span>
          </div>
          <span className="text-sm font-bold text-[#2d3a7d] sm:text-[1.05rem]">{feature.title}</span>
        </div>
      ))}
    </div>
  );
}
