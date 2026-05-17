import { Zap, CheckCircle2 } from 'lucide-react';

type Props = {
  benefits: string[];
  title: string;
};

export function CourseBenefits({ benefits, title }: Props) {
  return (
    <section>
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
          <Zap size={24} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {benefits.map((benefit, idx) => (
          <div
            key={`${benefit.slice(0, 24)}-${idx}`}
            className="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:border-indigo-100"
          >
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <CheckCircle2 size={14} />
            </div>
            <p className="font-bold leading-relaxed text-slate-700">{benefit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
