'use client';

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  TrendingUp,
  Wallet,
  Sparkles,
  Plus,
  ArrowRight,
  MoreVertical,
  Activity,
  Target,
  Zap,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const kpis = [
  {
    label: 'Total Students',
    value: '5,248',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'indigo',
    gradient: 'from-indigo-600 to-violet-600',
  },
  {
    label: 'Course Revenue',
    value: '$84,200',
    change: '+8.1%',
    trend: 'up',
    icon: Wallet,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Avg. Attendance',
    value: '94.2%',
    change: '-1.4%',
    trend: 'down',
    icon: Activity,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    label: 'Active Batches',
    value: '128',
    change: '+4.3%',
    trend: 'up',
    icon: Target,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
  },
];

const recentActivities = [
  { 
    user: 'Sarah Connor',
    action: 'enrolled in',
    target: 'Advance Physics 101',
    time: '2 mins ago',
    avatar: 'SC',
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    user: 'John Doe',
    action: 'submitted',
    target: 'Term Exam - Math',
    time: '45 mins ago',
    avatar: 'JD',
    color: 'bg-emerald-100 text-emerald-600'
  },
  { 
    user: 'Admin Panel',
    action: 'generated',
    target: 'Monthly Revenue Report',
    time: '2 hours ago',
    avatar: 'AP',
    color: 'bg-indigo-100 text-indigo-600'
  },
  { 
    user: 'Batch A-2',
    action: 'scheduled',
    target: 'Live Session #42',
    time: '5 hours ago',
    avatar: 'A2',
    color: 'bg-rose-100 text-rose-600'
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-10">
      {/* Top Banner / Insight */}
      <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white lg:p-10 shadow-2xl shadow-indigo-200">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-600/20 to-transparent" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-300 backdrop-blur-md">
              <Zap className="h-3 w-3" />
              Intelligence Report
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Platform Growth is <span className="text-indigo-400">accelerating.</span>
            </h2>
            <p className="max-w-xl text-sm font-medium text-slate-400 leading-relaxed">
              Your conversion rate is up by <span className="text-white font-bold">8.4%</span> this week. We recommend launching the "Summer Specials" campaign to capitalize on the increased traffic.
            </p>
            <div className="flex flex-wrap gap-4">
               <button className="rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                 View Analytics
               </button>
               <button className="rounded-2xl bg-white/5 border border-white/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10">
                 Dismiss
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:w-72">
             <div className="rounded-[24px] bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth</p>
                <p className="mt-2 text-2xl font-black">+24%</p>
             </div>
             <div className="rounded-[24px] bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</p>
                <p className="mt-2 text-2xl font-black">1.2k</p>
             </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100"
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110",
                  kpi.gradient
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest",
                  kpi.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                )}>
                  {kpi.change}
                  <TrendingUp className={cn("h-3 w-3", kpi.trend === 'down' && 'rotate-180')} />
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <h3 className="mt-1 text-3xl font-black text-slate-900">{kpi.value}</h3>
              </div>

              {/* Sparkline Decorative */}
              <div className="mt-6 flex items-end gap-1 h-8 opacity-20 group-hover:opacity-40 transition-opacity">
                 {[40, 70, 45, 90, 65, 80, 50, 100].map((h, i) => (
                   <div key={i} className={cn("flex-1 rounded-t-sm", kpi.trend === 'up' ? 'bg-indigo-500' : 'bg-rose-500')} style={{ height: `${h}%` }} />
                 ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Insights Grid */}
      <section className="grid gap-8 xl:grid-cols-3">
        {/* Performance Chart Card */}
        <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Revenue Performance</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Comparison between physical and online courses</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1.5 border border-slate-100">
               <button className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-white">Monthly</button>
               <button className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 transition hover:text-slate-600">Weekly</button>
            </div>
          </div>

          {/* Abstract Chart Representation */}
          <div className="relative h-72 w-full mt-12 flex items-end justify-between px-4">
             {/* Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between py-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-slate-100 border-dashed" />
                ))}
             </div>

             {/* Bars */}
             {[55, 75, 60, 95, 80, 110, 85, 120, 100, 130, 115, 140].map((h, i) => (
               <div key={i} className="group relative w-full max-w-[40px] flex flex-col items-center gap-3 z-10">
                  <div className="relative w-full overflow-hidden rounded-t-2xl bg-slate-100 transition-all duration-500 group-hover:bg-indigo-600 group-hover:shadow-2xl group-hover:shadow-indigo-200" style={{ height: `${(h / 140) * 100}%` }}>
                     <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Real-time Activity Log */}
        <div className="rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
           <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Activity Log</h2>
              <button className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                 <MoreVertical className="h-5 w-5 text-slate-400" />
              </button>
           </div>

           <div className="space-y-8">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="group flex items-start gap-4 cursor-pointer">
                   <div className={cn(
                     "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-sm transition-transform group-hover:scale-110",
                     activity.color
                   )}>
                      {activity.avatar}
                   </div>
                   <div className="flex-1 min-w-0 border-b border-slate-50 pb-5 group-last:border-0">
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {activity.user} <span className="font-medium text-slate-400">{activity.action}</span>
                      </p>
                      <p className="text-sm font-black text-indigo-600 truncate mt-0.5">{activity.target}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{activity.time}</p>
                   </div>
                   <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </div>
              ))}
           </div>

           <button className="mt-6 w-full rounded-2xl bg-slate-50 py-4 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
             View Full Audit Log
           </button>
        </div>
      </section>

      {/* Quick Action Tiles */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
         {[
           { label: 'Create Course', icon: BookOpen, bg: 'bg-indigo-50', text: 'text-indigo-600' },
           { label: 'Register Student', icon: Users, bg: 'bg-emerald-50', text: 'text-emerald-600' },
           { label: 'New Exam', icon: GraduationCap, bg: 'bg-amber-50', text: 'text-amber-600' },
           { label: 'System Config', icon: Settings, bg: 'bg-slate-50', text: 'text-slate-600' },
         ].map((action, i) => (
           <button key={i} className="group flex items-center gap-4 rounded-[28px] bg-white border border-slate-100 p-4 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", action.bg, action.text)}>
                 <action.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-black tracking-tight text-slate-700">{action.label}</span>
              <Plus className="ml-auto h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
           </button>
         ))}
      </section>
    </div>
  );
}