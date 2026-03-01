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
    <div className="space-y-4">
      <section className="glass-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">A unified view of admissions and operations.</p>
          </div>
          <span className="text-xs text-muted-foreground">Time period:</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-md border border-border bg-muted/40 p-2 text-foreground/80">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {kpi.change}
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{kpi.value}</p>
            </article>
          );
        })}
        <article className="glass-panel grid place-items-center p-4 text-center">
          <button type="button" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Add data
          </button>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-5">
        <article className="glass-panel p-5 xl:col-span-3">
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
          <div className="mt-4 h-52 rounded-lg border border-border bg-[linear-gradient(180deg,#fff,rgba(248,250,252,0.8))]" />
        </article>

        <article className="glass-panel p-5 xl:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {recentActivities.map((item) => (
              <li key={item} className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
