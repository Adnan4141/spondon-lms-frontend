import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  TrendingUp,
  Wallet,
  Sparkles,
} from 'lucide-react';

const kpis = [
  {
    label: 'Active Students',
    value: '5,248',
    change: '+12.4%',
    icon: Users,
    iconBg: 'from-sky-500 to-cyan-400',
    glow: 'from-sky-500/20 to-cyan-500/10',
  },
  {
    label: 'Live Courses',
    value: '128',
    change: '+8.1%',
    icon: BookOpen,
    iconBg: 'from-violet-500 to-fuchsia-500',
    glow: 'from-violet-500/20 to-fuchsia-500/10',
  },
  {
    label: 'Programs Running',
    value: '26',
    change: '+4.3%',
    icon: GraduationCap,
    iconBg: 'from-pink-500 to-rose-500',
    glow: 'from-pink-500/20 to-rose-500/10',
  },
  {
    label: 'Today Classes',
    value: '43',
    change: '+9.7%',
    icon: CalendarDays,
    iconBg: 'from-emerald-500 to-teal-500',
    glow: 'from-emerald-500/20 to-teal-500/10',
  },
];

const recentActivities = [
  'New batch "HSC Physics Advance" created in Dhanmondi branch.',
  '52 invoices issued for February monthly plans.',
  'Model exam results published for SSC 2026 candidates.',
  'Course "University Math Crash" reached 500 enrollments.',
];

const miniStats = [
  {
    label: 'Monthly Revenue',
    value: '৳8.4L',
    icon: Wallet,
  },
  {
    label: 'Growth Rate',
    value: '18.2%',
    icon: TrendingUp,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_30%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
              Smart overview
            </div>
            <h1 className="mt-3 bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              A unified premium view of admissions, academic operations, branch activities, and overall institute performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <p className="text-white/45">Time period</p>
              <p className="font-semibold text-white">Last 30 days</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm">
              <p className="text-emerald-200/70">Overall status</p>
              <p className="font-semibold text-emerald-200">Excellent</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <article
              key={kpi.label}
              className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.glow} opacity-80`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.iconBg} text-white shadow-lg`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {kpi.change}
                  </span>
                </div>

                <p className="mt-5 text-sm text-white/55">{kpi.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-white">{kpi.value}</p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full w-2/3 rounded-full bg-gradient-to-r ${kpi.iconBg}`}
                  />
                </div>
              </div>
            </article>
          );
        })}

        <article className="group relative overflow-hidden rounded-[24px] border border-dashed border-white/15 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/30 hover:bg-white/[0.07]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.14),transparent_45%)]" />
          <div className="relative flex h-full min-h-[180px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Add New Widget</h3>
            <p className="mt-1 text-sm text-white/50">
              Customize dashboard cards for your team.
            </p>
            <button
              type="button"
              className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Add data
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl xl:col-span-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]" />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Operational Performance
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                  Enrollment and fee collection have improved this month. Branch-level operations are performing steadily, with strong momentum in admissions and payment follow-ups.
                </p>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Last 30 days
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {miniStats.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-white/50">{item.label}</p>
                        <p className="text-lg font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
              <div className="flex h-64 items-end gap-3">
                {[38, 55, 48, 72, 66, 84, 76, 92, 88, 108, 96, 120].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-fuchsia-500 via-violet-500 to-cyan-400 shadow-lg"
                      style={{ height: `${h * 1.5}px` }}
                    />
                    <span className="text-[10px] text-white/35">
                      {
                        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-white">Recent Activity</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
              Live updates
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {recentActivities.map((item, index) => (
              <div
                key={item}
                className="group flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08]"
              >
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.55)]" />
                  {index !== recentActivities.length - 1 && (
                    <div className="mt-2 h-full w-px bg-white/10" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm leading-6 text-white/75">{item}</p>
                  <p className="mt-1 text-xs text-white/35">Just updated</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}