import { Activity, Building2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type PartnersStatsGridProps = {
  total: number;
  visible: number;
  hidden: number;
};

const STATS = [
  { key: 'total' as const, label: 'Total partners', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'visible' as const, label: 'Visible on homepage', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'hidden' as const, label: 'Hidden (draft)', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export function PartnersStatsGrid({ total, visible, hidden }: PartnersStatsGridProps) {
  const values = { total, visible, hidden };

  return (
    <section className="grid gap-6 sm:grid-cols-3">
      {STATS.map((stat) => (
        <div
          key={stat.key}
          className="flex items-center gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] shadow-inner',
              stat.bg,
              stat.color,
            )}
          >
            <stat.icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-0.5 text-2xl font-black text-slate-900">{values[stat.key]}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
