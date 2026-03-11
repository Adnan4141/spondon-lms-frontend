'use client';

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  TrendingUp,
  Wallet,
  Layers,
  Plus,
  ArrowRight,
  MoreVertical,
  Activity,
  Target,
  Zap,
  Settings,
  ShieldCheck,
  CreditCard,
  PieChart,
  BarChart3,
  Globe
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
    <div className="space-y-10 pb-10 text-slate-900">
     

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
        <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                 <TrendingUp className="h-3 w-3" />
                 Revenue Performance
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Institutional Yield</h2>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1.5 border border-slate-100">
               <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-white">Financial Year</button>
               <button className="rounded-xl px-4 py-2 text-sm font-bold text-slate-400 transition hover:text-slate-600">Quarterly</button>
            </div>
          </div>

          {/* Premium Static SVG Chart */}
          <div className="relative h-80 w-full mt-8">
             <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                   </linearGradient>
                   <filter id="shadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.2"/>
                   </filter>
                </defs>
                
                {/* Horizontal Grid Lines */}
                {[0, 1, 2, 3, 4].map(i => (
                   <line key={i} x1="0" y1={i * 75} x2="800" y2={i * 75} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* Area Path */}
                <path 
                   d="M0,250 C100,220 150,280 200,180 C250,80 300,150 400,120 C500,90 600,200 700,100 C750,50 800,80 800,80 L800,300 L0,300 Z" 
                   fill="url(#chartGradient)"
                />
                
                {/* Line Path */}
                <path 
                   d="M0,250 C100,220 150,280 200,180 C250,80 300,150 400,120 C500,90 600,200 700,100 C750,50 800,80 800,80" 
                   fill="none" 
                   stroke="#6366f1" 
                   strokeWidth="4" 
                   strokeLinecap="round"
                   filter="url(#shadow)"
                />

                {/* Interaction Points */}
                {[200, 400, 700].map((x, i) => (
                   <g key={i}>
                      <circle cx={x} cy={x === 200 ? 180 : x === 400 ? 120 : 100} r="6" fill="#fff" stroke="#6366f1" strokeWidth="3" />
                      <circle cx={x} cy={x === 200 ? 180 : x === 400 ? 120 : 100} r="12" fill="#6366f1" fillOpacity="0.1" />
                   </g>
                ))}
             </svg>
             
             <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 pt-4">
                {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map(m => (
                   <span key={m} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m}</span>
                ))}
             </div>
          </div>
        </div>

        {/* Real-time Activity Log */}
        <div className="rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
           <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                 <h2 className="text-xl font-black tracking-tight text-slate-900">Activity Log</h2>
                 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live System Feed
                 </p>
              </div>
              <button className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                 <MoreVertical className="h-5 w-5 text-slate-400" />
              </button>
           </div>

           <div className="space-y-8">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="group flex items-start gap-4 cursor-pointer">
                   <div className={cn(
                     "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3",
                     activity.color
                   )}>
                      {activity.avatar}
                   </div>
                   <div className="flex-1 min-w-0 border-b border-slate-50 pb-5 group-last:border-0">
                      <p className="text-base font-bold text-slate-800 leading-tight">
                        {activity.user} <span className="font-medium text-slate-400">{activity.action}</span>
                      </p>
                      <p className="text-base font-black text-indigo-600 truncate mt-0.5">{activity.target}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{activity.time}</p>
                   </div>
                   <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </div>
              ))}
           </div>

           <button className="mt-6 w-full h-14 rounded-2xl bg-slate-50 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:bg-slate-900 hover:text-white shadow-inner">
             Audit Governance
           </button>
        </div>
      </section>

      {/* Second Analytics Row */}
      <section className="grid gap-8 xl:grid-cols-3">
         {/* Distribution Chart */}
         <div className="rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
            <h2 className="text-xl font-black tracking-tight text-slate-900 mb-8">Enrollment Distribution</h2>
            <div className="relative flex flex-col items-center justify-center pt-4">
               <svg className="h-48 w-48 -rotate-90">
                  <circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="24" fill="none" />
                  <circle 
                     cx="96" cy="96" r="80" stroke="#6366f1" strokeWidth="24" fill="none" 
                     strokeDasharray="502.4" strokeDashoffset="150" strokeLinecap="round"
                  />
                  <circle 
                     cx="96" cy="96" r="80" stroke="#10b981" strokeWidth="24" fill="none" 
                     strokeDasharray="502.4" strokeDashoffset="400" strokeLinecap="round"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                  <p className="text-3xl font-black">84%</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</p>
               </div>
            </div>
            
            <div className="mt-10 space-y-4">
               {[
                  { label: 'Academic Programs', value: '62%', color: 'bg-indigo-500' },
                  { label: 'Technical Tracks', value: '28%', color: 'bg-emerald-500' },
                  { label: 'Vocational', value: '10%', color: 'bg-slate-200' },
               ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                        <span className="text-sm font-bold text-slate-600">{item.label}</span>
                     </div>
                     <span className="text-sm font-black text-slate-900">{item.value}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Course Popularity List */}
         <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-xl font-black tracking-tight text-slate-900">Curriculum Heatmap</h2>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  <BarChart3 className="h-4 w-4" />
                  Popularity Index
               </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
               {[
                  { name: 'Quantum Physics Masters', code: 'PHY-01', growth: '+42%', val: 85, color: 'bg-indigo-500' },
                  { name: 'Advanced Mathematics', code: 'MAT-04', growth: '+12%', val: 65, color: 'bg-violet-500' },
                  { name: 'Digital Architecture', code: 'ARC-02', growth: '+28%', val: 72, color: 'bg-blue-500' },
                  { name: 'Molecular Biology', code: 'BIO-09', growth: '+5%', val: 45, color: 'bg-emerald-500' },
               ].map((course, i) => (
                  <div key={i} className="group p-6 rounded-3xl border border-slate-50 bg-slate-50/30 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{course.name}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{course.code}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500">{course.growth}</span>
                     </div>
                     <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full transition-all duration-1000", course.color)} style={{ width: `${course.val}%` }} />
                     </div>
                  </div>
               ))}
            </div>
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
           <button key={i} className="group flex items-center gap-4 rounded-[32px] bg-white border border-slate-100 p-5 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/30 hover:-translate-y-1">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-sm", action.bg, action.text)}>
                 <action.icon className="h-6 w-6" />
              </div>
              <span className="text-base font-black tracking-tight text-slate-700">{action.label}</span>
              <Plus className="ml-auto h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
           </button>
         ))}
      </section>
    </div>
  );
}
