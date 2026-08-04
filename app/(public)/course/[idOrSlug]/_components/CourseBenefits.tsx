import { GraduationCap, Check } from 'lucide-react';

type Props = {
  benefits: string[];
  title: string;
};

export function CourseBenefits({ benefits, title }: Props) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
          <GraduationCap size={22} className="text-white" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">কেন এই কোর্সটি করবেন?</span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">{title}</h2>
        </div>
      </div>

      {/* Grid of Benefit Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {benefits.map((benefit, idx) => {
          return (
            <div
              key={`${benefit.slice(0, 24)}-${idx}`}
              className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200"
            >
              {/* Green Check Icon Wrapper */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-emerald-100/50">
                <Check size={13} className="stroke-[3.5]" />
              </div>

              {/* Benefit Description Text */}
              <div className="flex-1">
                <p className="font-semibold text-base leading-relaxed text-slate-800 transition-colors duration-300 group-hover:text-slate-950">
                  {benefit}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

