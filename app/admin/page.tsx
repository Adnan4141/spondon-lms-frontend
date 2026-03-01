import { ArrowUpRight, BookOpen, CalendarDays, GraduationCap, Users } from 'lucide-react';

const kpis = [
  {
    label: 'Active Students',
    value: '5,248',
    change: '+12.4%',
    icon: Users,
  },
  {
    label: 'Live Courses',
    value: '128',
    change: '+8.1%',
    icon: BookOpen,
  },
  {
    label: 'Programs Running',
    value: '26',
    change: '+4.3%',
    icon: GraduationCap,
  },
  {
    label: 'Today Classes',
    value: '43',
    change: '+9.7%',
    icon: CalendarDays,
  },
];

const recentActivities = [
  'New batch "HSC Physics Advance" created in Dhanmondi branch.',
  '52 invoices issued for February monthly plans.',
  'Model exam results published for SSC 2026 candidates.',
  'Course "University Math Crash" reached 500 enrollments.',
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <section className="glass-panel relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,_hsl(205_90%_92%),_transparent_70%)] [animation:float-slow_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-16 -left-14 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,_hsl(150_40%_89%),_transparent_70%)] [animation:float-slow_10s_ease-in-out_infinite]" />

        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            A unified view of admissions, billing, attendance, and academic operations across branches.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="glass-panel p-5">
              <div className="flex items-start justify-between">
                <div className="rounded-xl border border-border/70 bg-accent/30 p-2.5 text-foreground/80">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {kpi.change}
                </span>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <article className="glass-panel p-6 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Operational Performance</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Last 30 days
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Enrollment and fee collection have both improved this month. Keep focus on payment follow-ups in branch-level reports.
          </p>
          <div className="mt-6 h-44 rounded-xl border border-dashed border-border/80 bg-[linear-gradient(135deg,_color-mix(in_oklab,var(--accent)_38%,transparent),_transparent)]" />
        </article>

        <article className="glass-panel p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {recentActivities.map((item) => (
              <li key={item} className="rounded-xl border border-border/60 bg-background/80 p-3 text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
