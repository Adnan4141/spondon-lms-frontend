import { BookOpen, GraduationCap, Award, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          const config = getBenefitConfig(benefit, idx);
          const Icon = config.icon;

          return (
            <div
              key={`${benefit.slice(0, 24)}-${idx}`}
              className={cn(
                'group relative flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                config.hoverClass
              )}
            >
              {/* Path number overlay */}
              <span className={cn('absolute right-6 top-6 text-xs font-bold select-none transition-colors duration-300', config.numClass)}>
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Dynamic Icon Wrapper */}
              <div className={cn(
                'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105',
                config.colorClass
              )}>
                <Icon size={18} className="stroke-[2.5]" />
              </div>

              {/* Benefit Description Text */}
              <div className="pr-4">
                <p className="font-extrabold text-base leading-relaxed text-slate-800 transition-colors duration-300 group-hover:text-slate-950">
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

// Scans benefit content keywords to assign premium icons and hover gradients
function getBenefitConfig(benefit: string, index: number) {
  const text = benefit.toLowerCase();
  
  const themes = [
    {
      icon: BookOpen,
      colorClass: 'text-indigo-600 bg-indigo-50/70 border-indigo-100/40',
      hoverClass: 'hover:border-indigo-200/80 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/5',
      numClass: 'text-indigo-100 group-hover:text-indigo-200/50',
    },
    {
      icon: GraduationCap,
      colorClass: 'text-emerald-600 bg-emerald-50/70 border-emerald-100/40',
      hoverClass: 'hover:border-emerald-200/80 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/5',
      numClass: 'text-emerald-100 group-hover:text-emerald-200/50',
    },
    {
      icon: Award,
      colorClass: 'text-amber-600 bg-amber-50/70 border-amber-100/40',
      hoverClass: 'hover:border-amber-200/80 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/5',
      numClass: 'text-amber-100 group-hover:text-amber-200/50',
    },
    {
      icon: MessageSquare,
      colorClass: 'text-rose-600 bg-rose-50/70 border-rose-100/40',
      hoverClass: 'hover:border-rose-200/80 hover:bg-gradient-to-br hover:from-white hover:to-rose-50/5',
      numClass: 'text-rose-100 group-hover:text-rose-200/50',
    },
  ];

  if (text.includes('এক্সাম') || text.includes('পরীক্ষা') || text.includes('টেস্ট')) {
    return { ...themes[2], icon: Award };
  }
  if (text.includes('ডাউট') || text.includes('সলভিং') || text.includes('সাপোর্ট')) {
    return { ...themes[3], icon: MessageSquare };
  }
  if (text.includes('বেসিক') || text.includes('অ্যাডভান্স') || text.includes('কনসেপ্ট') || text.includes('ক্লিয়ার')) {
    return { ...themes[1], icon: GraduationCap };
  }
  if (text.includes('প্রস্তুতি') || text.includes('স্মার্ট') || text.includes('সিলেবাস') || text.includes('পদ্ধতি')) {
    return { ...themes[0], icon: BookOpen };
  }

  // Fallback rotation
  return themes[index % themes.length];
}
